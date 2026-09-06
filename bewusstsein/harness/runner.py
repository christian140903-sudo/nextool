"""
Runner fuer kontrollierte LLM-Experimente ueber die Claude-Code-CLI.

Prinzipien (aus Chrisos Messregeln):
- Roh-Artefakt-Zwang: jeder Aufruf landet als JSON auf Platte, sonst gilt er als "nicht gemessen".
- Wiederaufnahme: existiert das Artefakt, wird der Aufruf uebersprungen (Limit-Ueberleben).
- Armparitaet am Draht: Token werden je Aufruf gezaehlt und im Artefakt gespeichert.
- Nichts wird nur im Speicher gehalten.
"""
import json, os, subprocess, hashlib, time, threading
from concurrent.futures import ThreadPoolExecutor, as_completed

CLI = "claude"
DEFAULT_MODEL = "claude-haiku-4-5-20251001"

_print_lock = threading.Lock()
_rate_lock = threading.Lock()
_rate_backoff_until = [0.0]


def _log(msg):
    with _print_lock:
        print(msg, flush=True)


def call_model(system_prompt, user_prompt, model=DEFAULT_MODEL, timeout=300,
               max_retries=6, thinking=None):
    """Ein kontrollierter Modellaufruf. Gibt dict mit text/usage/fehler zurueck."""
    cmd = [CLI, "-p", "--restricted", "--no-session-persistence",
           "--output-format", "json", "--model", model]
    if system_prompt:
        cmd += ["--system-prompt", system_prompt]
    cmd += [user_prompt]

    last_err = None
    for attempt in range(max_retries):
        # globale Rate-Limit-Bremse respektieren
        while True:
            with _rate_lock:
                wait = _rate_backoff_until[0] - time.time()
            if wait <= 0:
                break
            time.sleep(min(wait, 30))
        try:
            env = dict(os.environ)
            if thinking is not None:
                env["MAX_THINKING_TOKENS"] = str(thinking)
            proc = subprocess.run(cmd, capture_output=True, text=True,
                                  timeout=timeout, env=env)
            raw = proc.stdout.strip()
            if not raw:
                last_err = f"leere Ausgabe (rc={proc.returncode}) {proc.stderr[:300]}"
                raise ValueError(last_err)
            data = json.loads(raw)
            if data.get("is_error"):
                msg = str(data.get("result", ""))[:400]
                last_err = f"api_error: {msg}"
                low = msg.lower()
                if "rate" in low or "limit" in low or "overload" in low or "529" in low:
                    with _rate_lock:
                        _rate_backoff_until[0] = max(
                            _rate_backoff_until[0], time.time() + min(60 * (attempt + 1), 300))
                raise ValueError(last_err)
            usage = data.get("usage", {}) or {}
            det = usage.get("output_tokens_details", {}) or {}
            return {
                "thinking_tokens": det.get("thinking_tokens", 0) or 0,
                "ok": True,
                "text": data.get("result", ""),
                "output_tokens": usage.get("output_tokens", 0) or 0,
                "input_tokens": usage.get("input_tokens", 0) or 0,
                "cache_read": usage.get("cache_read_input_tokens", 0) or 0,
                "cost_usd": data.get("total_cost_usd", 0) or 0,
                "duration_ms": data.get("duration_ms", 0) or 0,
                "model": model,
                "attempts": attempt + 1,
            }
        except subprocess.TimeoutExpired:
            last_err = f"timeout nach {timeout}s"
        except Exception as e:
            last_err = str(e)[:400]
        sleep = min(2 ** attempt * 2, 90)
        time.sleep(sleep)
    return {"ok": False, "text": "", "error": last_err, "output_tokens": 0,
            "input_tokens": 0, "cost_usd": 0, "model": model,
            "attempts": max_retries}


def artifact_path(outdir, suite, task_id, arm, run):
    safe = f"{suite}__{task_id}__{arm}__r{run}".replace("/", "_")
    return os.path.join(outdir, "raw", safe + ".json")


def run_jobs(jobs, outdir, workers=5, label=""):
    """jobs: Liste von dicts mit suite/task_id/arm/run/system/user/model/meta.
    Schreibt je Job ein Artefakt. Ueberspringt vorhandene. Gibt alle Ergebnisse zurueck."""
    os.makedirs(os.path.join(outdir, "raw"), exist_ok=True)
    todo, done = [], []
    for j in jobs:
        p = artifact_path(outdir, j["suite"], j["task_id"], j["arm"], j["run"])
        if os.path.exists(p):
            try:
                with open(p) as f:
                    done.append(json.load(f))
                continue
            except Exception:
                pass
        todo.append((j, p))

    total = len(jobs)
    _log(f"[{label}] {len(done)} vorhanden, {len(todo)} zu laufen (gesamt {total})")
    if not todo:
        return done

    counter = [0]

    def work(item):
        j, path = item
        t0 = time.time()
        res = call_model(j["system"], j["user"], model=j.get("model", DEFAULT_MODEL),
                         timeout=j.get("timeout", 300), thinking=j.get("thinking"))
        rec = {
            "suite": j["suite"], "task_id": j["task_id"], "arm": j["arm"], "run": j["run"],
            "model": j.get("model", DEFAULT_MODEL),
            "system_prompt_sha": hashlib.sha256((j["system"] or "").encode()).hexdigest()[:16],
            "system_prompt_chars": len(j["system"] or ""),
            "user_prompt": j["user"],
            "response": res.get("text", ""),
            "ok": res.get("ok", False),
            "error": res.get("error"),
            "output_tokens": res.get("output_tokens", 0),
            "thinking_tokens": res.get("thinking_tokens", 0),
            "thinking_budget": j.get("thinking"),
            "input_tokens": res.get("input_tokens", 0),
            "cost_usd": res.get("cost_usd", 0),
            "attempts": res.get("attempts"),
            "wall_s": round(time.time() - t0, 1),
            "meta": j.get("meta", {}),
        }
        tmp = path + ".tmp"
        with open(tmp, "w") as f:
            json.dump(rec, f, ensure_ascii=False)
        os.replace(tmp, path)
        with _print_lock:
            counter[0] += 1
            if counter[0] % 10 == 0 or counter[0] == len(todo):
                print(f"[{label}] {counter[0]}/{len(todo)}", flush=True)
        return rec

    results = list(done)
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(work, it) for it in todo]
        for fu in as_completed(futs):
            try:
                results.append(fu.result())
            except Exception as e:
                _log(f"[{label}] JOB-FEHLER: {e}")
    return results
