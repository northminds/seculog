const pino = require('pino');
const { v4: uuidv4 } = require('uuid');

function createLogger({ env = process.env.NODE_ENV || 'development', appName = 'default-service', lokiUrl, secureUrl } = {}) {
  let lokiLogger, secureLogger;

  if (env === 'production' && lokiUrl) {
    lokiLogger = pino(
      pino.transport({
        target: 'pino-loki',
        options: {
          batching: true,
          interval: 5,
          labels: { app: appName, env },
          host: lokiUrl,
        },
        level: 'info',
      })
    );
  }

  if (env === 'production' && secureUrl) {
    secureLogger = pino(pino.transport({
        target: require.resolve('./pino-secure-transport'),
        options: { url: secureUrl + '/log' },
        level: 'error',
      }));
  }

  // 🔹 Local mode
  if (env !== 'production') {
    lokiLogger = pino({
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname,source' },
      },
    });
  }

  // Simple error → only Loki
  function error(message, obj = {}) {
    lokiLogger?.error({ source: appName, ...obj }, message);
  }

  // secure error → short in Loki, detailed in Secure
  function secureError(message, payload) {
    const error_id = uuidv4();

    lokiLogger?.error({ error_id, source: appName }, message);

    secureLogger?.error({ error_id, source: appName, payload });

    return error_id;
  }

  return { error, secureError, info: (...args) => lokiLogger?.info(...args), warn: (...args) => lokiLogger?.warn(...args) };
}

module.exports = { createLogger };