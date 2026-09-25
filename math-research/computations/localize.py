"""Rigorose Lokalisierung: zerlegt ein Rechteck rekursiv, bis jede Box mit Windung > 0 klein ist.
Nur Boxen mit zertifizierter Windung werden gemeldet; Boxen mit Windung 0 enthalten sicher keine Nullstelle."""
import certify as C

def localize(f, s0, s1, t0, t1, min_size=1e-3, pieces=8, out=None, depth=0):
    if out is None: out=[]
    w = C.winding_number(f, s0, s1, t0, t1, pieces=pieces)
    if w == 0:
        return out
    if max(s1-s0, t1-t0) <= min_size:
        out.append({"sigma":[s0,s1],"t":[t0,t1],"winding":w}); return out
    # längere Seite halbieren; Schnittlinie leicht verschieben, falls sie eine Nullstelle trifft
    for shift in (0.0, 0.0137, -0.0231, 0.0419):
        try:
            if (t1-t0) >= (s1-s0):
                m = t0 + (t1-t0)*(0.5+shift)
                a = localize(f, s0, s1, t0, m, min_size, pieces, [], depth+1)
                b = localize(f, s0, s1, m, t1, min_size, pieces, [], depth+1)
            else:
                m = s0 + (s1-s0)*(0.5+shift)
                a = localize(f, s0, m, t0, t1, min_size, pieces, [], depth+1)
                b = localize(f, m, s1, t0, t1, min_size, pieces, [], depth+1)
            got = a + b
            if sum(x["winding"] for x in got) != w:
                raise RuntimeError("Windungsbilanz verletzt")
            out.extend(got); return out
        except RuntimeError as e:
            if "Windungsbilanz" in str(e): raise
            continue
    raise RuntimeError("Lokalisierung gescheitert")
