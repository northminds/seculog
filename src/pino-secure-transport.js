'use strict';

const build = require('pino-abstract-transport');
const axios = require('axios');

module.exports = async function (opts) {
  const { url, method = 'POST', headers = {} } = opts;
  if (!url) {
    throw new Error('Missing required option: url');
  }

  return build(async function (source) {
      for await (const obj of source) {
      try {
        await axios({
          url,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          data: {
            error_id: obj.error_id,
            source: obj.source,
            payload: obj.payload,
          },
          timeout: 5000,
        });
      } catch (err) {
        console.error('Transport error sending log:', err.message);
      }
    }
  });
};