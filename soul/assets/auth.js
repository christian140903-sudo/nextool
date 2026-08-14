/* Soul — Auth-Layer über Supabase.
 *
 * Kapselt Client-Erzeugung, OAuth, E-Mail/Passwort und Session-Guards.
 * Alle Fehler werden in menschenlesbare deutsche Meldungen übersetzt; nicht
 * aktivierte OAuth-Provider werden explizit als solche benannt, damit der
 * Zustand nicht als generischer Fehler untergeht.
 */
(function () {
  "use strict";

  var cfg = window.SOUL_CONFIG || {};
  var configured =
    typeof cfg.SUPABASE_URL === "string" &&
    cfg.SUPABASE_URL.indexOf("http") === 0 &&
    typeof cfg.SUPABASE_ANON_KEY === "string" &&
    cfg.SUPABASE_ANON_KEY.length > 20;

  var client = null;
  if (configured && window.supabase && window.supabase.createClient) {
    client = window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  }

  /* Supabase-Fehler → deutsche Klartextmeldung. */
  function humanize(err) {
    if (!err) return "Unbekannter Fehler.";
    var msg = String(err.message || err.error_description || err).trim();
    var low = msg.toLowerCase();

    // Provider im Dashboard nicht aktiviert — der häufigste Stolperstein.
    if (
      low.indexOf("provider is not enabled") > -1 ||
      low.indexOf("unsupported provider") > -1
    ) {
      return "Dieser Anmelde-Provider ist im Supabase-Projekt noch nicht aktiviert.";
    }
    if (low.indexOf("invalid login credentials") > -1) {
      return "E-Mail oder Passwort stimmt nicht.";
    }
    if (low.indexOf("email not confirmed") > -1) {
      return "Die E-Mail-Adresse ist noch nicht bestätigt. Bitte den Link aus der Bestätigungsmail öffnen.";
    }
    if (
      low.indexOf("user already registered") > -1 ||
      low.indexOf("already been registered") > -1
    ) {
      return "Für diese E-Mail existiert bereits ein Konto. Bitte anmelden.";
    }
    if (low.indexOf("password should be at least") > -1) {
      return "Das Passwort ist zu kurz — mindestens 8 Zeichen.";
    }
    if (
      low.indexOf("rate limit") > -1 ||
      low.indexOf("too many requests") > -1
    ) {
      return "Zu viele Versuche. Bitte kurz warten und erneut probieren.";
    }
    if (
      low.indexOf("failed to fetch") > -1 ||
      low.indexOf("networkerror") > -1
    ) {
      return "Keine Verbindung zum Auth-Server. Netzwerk oder Supabase-Konfiguration prüfen.";
    }
    return msg;
  }

  function requireClient() {
    if (!client) {
      throw new Error(
        "Supabase ist nicht konfiguriert. SUPABASE_URL und SUPABASE_ANON_KEY in assets/config.js setzen.",
      );
    }
    return client;
  }

  function redirectTo(path) {
    return new URL(
      path,
      window.location.origin + (cfg.SITE_BASE || "/soul/"),
    ).toString();
  }

  var Auth = {
    client: client,
    isConfigured: configured && !!client,

    humanize: humanize,

    /* OAuth über Google oder GitHub. */
    signInWithProvider: function (provider) {
      return requireClient()
        .auth.signInWithOAuth({
          provider: provider,
          options: { redirectTo: redirectTo("dashboard.html") },
        })
        .then(function (res) {
          if (res.error) throw res.error;
          return res.data;
        });
    },

    signUpWithEmail: function (firstName, lastName, email, password) {
      return requireClient()
        .auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: (firstName + " " + lastName).trim(),
            },
            emailRedirectTo: redirectTo("dashboard.html"),
          },
        })
        .then(function (res) {
          if (res.error) throw res.error;
          return res.data;
        });
    },

    signInWithEmail: function (email, password) {
      return requireClient()
        .auth.signInWithPassword({ email: email, password: password })
        .then(function (res) {
          if (res.error) throw res.error;
          return res.data;
        });
    },

    resetPassword: function (email) {
      return requireClient()
        .auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo("login.html"),
        })
        .then(function (res) {
          if (res.error) throw res.error;
          return res.data;
        });
    },

    signOut: function () {
      if (!client) return Promise.resolve();
      return client.auth.signOut();
    },

    getSession: function () {
      if (!client) return Promise.resolve(null);
      return client.auth.getSession().then(function (res) {
        return (res.data && res.data.session) || null;
      });
    },

    /* Anzeigename aus den Metadaten, mit E-Mail-Localpart als Rückfallebene. */
    displayName: function (user) {
      if (!user) return "";
      var m = user.user_metadata || {};
      var name =
        m.full_name ||
        [m.first_name, m.last_name].filter(Boolean).join(" ") ||
        m.name ||
        m.user_name ||
        "";
      name = String(name).trim();
      if (name) return name;
      return String(user.email || "").split("@")[0];
    },

    onAuthStateChange: function (cb) {
      if (!client) return { unsubscribe: function () {} };
      return client.auth.onAuthStateChange(cb);
    },
  };

  window.SoulAuth = Auth;
})();
