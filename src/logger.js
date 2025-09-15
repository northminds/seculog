const pino = require('pino');
const { v4: uuidv4 } = require('uuid');

function createLogger({ env = process.env.NODE_ENV || 'development', appName = 'default-service', lokiUrl, secureUrl } = {}) {
  let baseLogger;
  let lokiLogger;
  let secureLogger;

  // Always provide a local logger so logging never no-ops
  if (env !== 'production') {
    baseLogger = pino({
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname,source' },
      },
    });
  } else {
    baseLogger = pino({ level: 'info' });
  }

  // Try to create Loki transport, but never let failures crash
  if (env === 'production' && lokiUrl) {
    try {
      const lokiTransport = pino.transport({
        target: 'pino-loki',
        options: {
          batching: true,
          interval: 5,
          labels: { app: appName, env },
          host: lokiUrl,
        },
        level: 'info',
      });
      lokiLogger = pino(lokiTransport);
    } catch (err) {
      baseLogger.warn({ err: err && err.message }, 'Loki transport init failed; using local logger only');
      lokiLogger = baseLogger;
    }
  } else {
    // If no Loki configured, fall back to base logger
    lokiLogger = baseLogger;
  }

  // Try to create secure transport, but never let failures crash
  if (env === 'production' && secureUrl) {
    try {
      const secureTransport = pino.transport({
        target: require.resolve('./pino-secure-transport'),
        options: { url: secureUrl + '/log' },
        level: 'error',
      });
      secureLogger = pino(secureTransport);
    } catch (err) {
      baseLogger.warn({ err: err && err.message }, 'Secure transport init failed; proceeding without secure sink');
      secureLogger = null;
    }
  }

  // Simple error → write to Loki (or base)
  function error(message, obj = {}) {
    try {
      lokiLogger && lokiLogger.error({ source: appName, ...obj }, message);
    } catch (e) {
      // Final safeguard; write to stderr if something throws
      try { baseLogger.error({ source: appName, fallback: true, ...obj }, message); } catch (_) {}
    }
  }

  // secure error → short in Loki, detailed in Secure
  function secureError(message, payload) {
    const error_id = uuidv4();

    try {
      lokiLogger && lokiLogger.error({ error_id, source: appName }, message);
    } catch (e) {
      try { baseLogger.error({ error_id, source: appName, fallback: true }, message); } catch (_) {}
    }

    try {
      secureLogger && secureLogger.error({ error_id, source: appName, payload });
    } catch (e) {
      // If secure sink fails synchronously, at least capture locally
      try { baseLogger.error({ error_id, source: appName, secureFailed: true }); } catch (_) {}
    }

    return error_id;
  }

  return {
    error,
    secureError,
    info: (message, obj = {}) => {
      try {
        return lokiLogger && lokiLogger.info({ source: appName, ...obj }, message);
      } catch (_) {
        try { return baseLogger.info({ source: appName, fallback: true, ...obj }, message); } catch (_) {}
      }
    },
    warn: (message, obj = {}) => {
      try {
        return lokiLogger && lokiLogger.warn({ source: appName, ...obj }, message);
      } catch (_) {
        try { return baseLogger.warn({ source: appName, fallback: true, ...obj }, message); } catch (_) {}
      }
    },
  };
}

module.exports = { createLogger };
