/* Soul — Client für die Schlüssel-API des 4.1.x-Proxy.
 *
 * Der Proxy ist noch nicht deployt. Dieser Client ist deshalb so gebaut, dass
 * er den Unterschied zwischen "nicht erreichbar", "nicht berechtigt" und
 * "echter Fehler" sauber nach aussen gibt. Es wird nie ein Ergebnis erfunden:
 * wenn der Endpunkt schweigt, meldet die UI genau das.
 */
(function () {
  "use strict";

  var cfg = window.SOUL_CONFIG || {};
  var BASE = String(cfg.API_BASE || "").replace(/\/+$/, "");

  /* Alle Pfade an einer Stelle — wenn der Proxy andere Routen ausliefert,
   * ist das hier eine Ein-Zeilen-Änderung. */
  var ROUTES = {
    health: "/healthz",
    list: "/v1/keys",
    create: "/v1/keys",
    revoke: function (id) {
      return "/v1/keys/" + encodeURIComponent(id);
    },
  };

  /* Fehlerklassen, damit die UI unterscheiden kann, was los ist. */
  function ApiError(kind, message, status) {
    var e = new Error(message);
    e.kind = kind; // 'offline' | 'auth' | 'notfound' | 'server' | 'bad'
    e.status = status || 0;
    return e;
  }

  var TIMEOUT_MS = 8000;

  function request(path, options) {
    options = options || {};
    if (!BASE) {
      return Promise.reject(
        ApiError(
          "offline",
          "Keine API-Adresse konfiguriert (API_BASE in config.js).",
        ),
      );
    }

    var ctrl =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctrl
      ? setTimeout(function () {
          ctrl.abort();
        }, options.timeout || TIMEOUT_MS)
      : null;

    var headers = { Accept: "application/json" };
    if (options.token) headers.Authorization = "Bearer " + options.token;
    if (options.body) headers["Content-Type"] = "application/json";

    return fetch(BASE + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: ctrl ? ctrl.signal : undefined,
      mode: "cors",
      credentials: "omit",
    })
      .catch(function () {
        // Netzwerkfehler, DNS, CORS, Abbruch — von aussen nicht unterscheidbar.
        throw ApiError("offline", "Die Proxy-API ist nicht erreichbar.");
      })
      .then(function (res) {
        if (timer) clearTimeout(timer);

        if (res.status === 401 || res.status === 403) {
          throw ApiError(
            "auth",
            "Die Sitzung wird von der API nicht akzeptiert.",
            res.status,
          );
        }
        if (res.status === 404) {
          throw ApiError(
            "notfound",
            "Dieser Endpunkt existiert auf der API noch nicht.",
            404,
          );
        }
        if (res.status >= 500) {
          throw ApiError(
            "server",
            "Die API hat mit einem Fehler geantwortet (" + res.status + ").",
            res.status,
          );
        }

        return res
          .json()
          .catch(function () {
            // Antwort ohne JSON — typisch für eine Platzhalterseite unter der
            // Domain. Das ist kein funktionierender Endpunkt.
            throw ApiError(
              "bad",
              "Die API hat keine verwertbare Antwort geliefert.",
              res.status,
            );
          })
          .then(function (data) {
            if (!res.ok) {
              throw ApiError(
                "server",
                (data && (data.error || data.message)) ||
                  "Die Anfrage wurde abgelehnt (" + res.status + ").",
                res.status,
              );
            }
            return data;
          });
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        throw err;
      });
  }

  window.SoulApi = {
    base: BASE,
    routes: ROUTES,

    /* Erreichbarkeitsprüfung. Liefert true/false statt zu werfen — der
     * Nichterreichbarkeits-Fall ist hier ein erwartetes Ergebnis. */
    health: function () {
      return request(ROUTES.health, { timeout: 5000 }).then(
        function () {
          return true;
        },
        function () {
          return false;
        },
      );
    },

    listKeys: function (token) {
      return request(ROUTES.list, { token: token }).then(function (data) {
        // Sowohl {keys:[…]} als auch ein blankes Array akzeptieren.
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.keys)) return data.keys;
        return [];
      });
    },

    createKey: function (token, name) {
      return request(ROUTES.create, {
        method: "POST",
        token: token,
        body: { name: name },
      });
    },

    revokeKey: function (token, id) {
      return request(ROUTES.revoke(id), { method: "DELETE", token: token });
    },
  };
})();
