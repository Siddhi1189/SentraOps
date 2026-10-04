(function (window) {
  'use strict';

  var config = null;
  var dsnParsed = null;

  function parseDsn(dsn) {
    try {
      var url = new URL(dsn);
      var apiKey = url.username;
      var host = url.host;
      var protocol = url.protocol;
      var projectId = url.pathname.replace(/^\/+/, '');
      if (!apiKey || !projectId) return null;
      return {
        apiKey: apiKey,
        projectId: projectId,
        ingestUrl: protocol + '//' + host + '/api/ingest/events',
      };
    } catch (e) {
      return null;
    }
  }

  function sendEvent(payload) {
    if (!dsnParsed) return;
    try {
      fetch(dsnParsed.ingestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sentraops-key': dsnParsed.apiKey,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {
      // Fail silently in browser
    }
  }

  function captureException(error, options) {
    if (!dsnParsed) return;
    options = options || {};

    var errObj = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));
    var type = (error && error.name) || errObj.name || 'Error';
    var message = (error && error.message) || errObj.message || 'Unknown error';
    var stack = (error && error.stack) || errObj.stack || '';

    var payload = {
      projectId: dsnParsed.projectId,
      type: type,
      message: message,
      stack: stack,
      environment: (config && config.environment) || 'production',
      release: (config && config.release) || null,
      level: options.level || 'error',
      tags: Object.assign({ platform: 'browser' }, options.tags || {}),
      breadcrumbs: options.breadcrumbs || [],
      user: options.user || null,
      request: {
        url: window.location.href,
        headers: {
          'user-agent': window.navigator.userAgent,
        },
      },
      occurredAt: new Date().toISOString(),
    };

    sendEvent(payload);
  }

  function init(options) {
    if (!options || !options.dsn) return;
    config = options;
    dsnParsed = parseDsn(options.dsn);
    if (!dsnParsed) {
      console.warn('[SentraOps] Invalid DSN provided');
      return;
    }

    // Auto-capture global uncaught errors
    window.addEventListener('error', function (event) {
      if (event.error) {
        captureException(event.error, {
          tags: { mechanism: 'onerror' },
        });
      } else if (event.message) {
        captureException(new Error(event.message + ' at ' + event.filename + ':' + event.lineno), {
          tags: { mechanism: 'onerror' },
        });
      }
    });

    // Auto-capture unhandled promise rejections
    window.addEventListener('unhandledrejection', function (event) {
      var reason = event.reason;
      captureException(reason instanceof Error ? reason : new Error(String(reason)), {
        tags: { mechanism: 'unhandledrejection' },
      });
    });
  }

  window.SentraOps = {
    init: init,
    captureException: captureException,
  };
})(window);
