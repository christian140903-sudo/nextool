/**
 * NexTool Analytics Lite
 * Privacy-friendly, localStorage-only analytics
 * No cookies, no external calls, < 5KB
 * Self-initializing on load
 * Access stats: window.__ntoolStats or NToolAnalytics.getReport()
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ntool_analytics';
  var SESSION_KEY = 'ntool_session';

  // ── Storage ──
  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : createFreshData();
    } catch (e) {
      return createFreshData();
    }
  }

  function saveData(data) {
    try {
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.__ntoolStats = data;
    } catch (e) { /* quota exceeded, silently fail */ }
  }

  function createFreshData() {
    return {
      firstVisit: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalPageViews: 0,
      totalSessions: 0,
      pages: {},
      tools: {},
      referrers: {},
      dailyViews: {},
      avgTimeOnPage: 0,
      totalTimeTracked: 0,
      timeEntries: 0
    };
  }

  // ── Session management ──
  function getSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveSession(session) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) { /* */ }
  }

  // ── Page & path helpers ──
  function getPagePath() {
    return location.pathname.replace(/\/+$/, '') || '/';
  }

  function getToolSlug() {
    var match = location.pathname.match(/\/free-tools\/([^\/]+)\.html/);
    return match ? match[1] : null;
  }

  function getDateKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getReferrerDomain() {
    if (!document.referrer) return 'direct';
    try {
      var url = new URL(document.referrer);
      if (url.hostname === location.hostname) return 'internal';
      return url.hostname.replace(/^www\./, '');
    } catch (e) {
      return 'unknown';
    }
  }

  // ── Track page view ──
  function trackPageView(data) {
    var path = getPagePath();
    var dateKey = getDateKey();
    var referrer = getReferrerDomain();

    // Total page views
    data.totalPageViews = (data.totalPageViews || 0) + 1;

    // Per-page views
    if (!data.pages[path]) {
      data.pages[path] = { views: 0, firstSeen: new Date().toISOString() };
    }
    data.pages[path].views += 1;
    data.pages[path].lastSeen = new Date().toISOString();

    // Tool tracking
    var tool = getToolSlug();
    if (tool) {
      if (!data.tools[tool]) {
        data.tools[tool] = { uses: 0, firstUsed: new Date().toISOString() };
      }
      data.tools[tool].uses += 1;
      data.tools[tool].lastUsed = new Date().toISOString();
    }

    // Referrer tracking
    if (!data.referrers[referrer]) {
      data.referrers[referrer] = 0;
    }
    data.referrers[referrer] += 1;

    // Daily views
    if (!data.dailyViews[dateKey]) {
      data.dailyViews[dateKey] = 0;
    }
    data.dailyViews[dateKey] += 1;

    // Session tracking
    var session = getSession();
    if (!session) {
      data.totalSessions = (data.totalSessions || 0) + 1;
      session = {
        id: data.totalSessions,
        start: Date.now(),
        pages: 0
      };
    }
    session.pages += 1;
    session.lastActivity = Date.now();
    saveSession(session);

    return data;
  }

  // ── Track time on page ──
  function trackTime(data) {
    var startTime = Date.now();

    function recordTime() {
      var elapsed = Math.round((Date.now() - startTime) / 1000);
      if (elapsed < 1 || elapsed > 3600) return; // Ignore invalid durations

      // Reload current data to avoid overwrites
      var freshData = loadData();
      freshData.totalTimeTracked = (freshData.totalTimeTracked || 0) + elapsed;
      freshData.timeEntries = (freshData.timeEntries || 0) + 1;
      freshData.avgTimeOnPage = Math.round(freshData.totalTimeTracked / freshData.timeEntries);

      // Store per-page time
      var path = getPagePath();
      if (freshData.pages[path]) {
        freshData.pages[path].totalTime = (freshData.pages[path].totalTime || 0) + elapsed;
        freshData.pages[path].avgTime = Math.round(freshData.pages[path].totalTime / freshData.pages[path].views);
      }

      saveData(freshData);
    }

    // Track on visibility change and unload
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') recordTime();
    });

    window.addEventListener('beforeunload', recordTime);
  }

  // ── Prune old daily data (keep 90 days) ──
  function pruneOldData(data) {
    var cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
    var daily = data.dailyViews || {};
    var keys = Object.keys(daily);
    for (var i = 0; i < keys.length; i++) {
      var d = new Date(keys[i]);
      if (d.getTime() < cutoff) {
        delete daily[keys[i]];
      }
    }
    return data;
  }

  // ── Report generator ──
  function getReport() {
    var data = loadData();

    // Sort tools by usage
    var toolEntries = Object.keys(data.tools).map(function (k) {
      return { name: k, uses: data.tools[k].uses, lastUsed: data.tools[k].lastUsed };
    }).sort(function (a, b) { return b.uses - a.uses; });

    // Sort pages by views
    var pageEntries = Object.keys(data.pages).map(function (k) {
      return { path: k, views: data.pages[k].views, avgTime: data.pages[k].avgTime || 0 };
    }).sort(function (a, b) { return b.views - a.views; });

    // Sort referrers
    var refEntries = Object.keys(data.referrers).map(function (k) {
      return { source: k, count: data.referrers[k] };
    }).sort(function (a, b) { return b.count - a.count; });

    // Daily views for last 30 days
    var last30 = {};
    var now = new Date();
    for (var i = 29; i >= 0; i--) {
      var d = new Date(now);
      d.setDate(d.getDate() - i);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      last30[key] = data.dailyViews[key] || 0;
    }

    return {
      summary: {
        totalPageViews: data.totalPageViews,
        totalSessions: data.totalSessions,
        uniqueToolsUsed: toolEntries.length,
        avgTimeOnPage: data.avgTimeOnPage + 's',
        firstVisit: data.firstVisit,
        lastUpdated: data.lastUpdated
      },
      topTools: toolEntries.slice(0, 10),
      topPages: pageEntries.slice(0, 10),
      referrers: refEntries,
      dailyViews: last30,
      rawToolCount: toolEntries.length,
      rawPageCount: pageEntries.length
    };
  }

  // ── Initialize ──
  function init() {
    var data = loadData();
    data = trackPageView(data);
    data = pruneOldData(data);
    saveData(data);
    trackTime(data);

    // Expose globally
    window.__ntoolStats = data;
    window.NToolAnalytics = {
      getReport: getReport,
      getRawData: loadData
    };
  }

  // Run immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
