// Minimal structured logger. Swap for pino/winston later without touching callers.
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const current = process.env.LOG_LEVEL || 'info';

function log(level, msg, meta) {
  if (levels[level] > levels[current]) return;
  const entry = { ts: new Date().toISOString(), level, msg, ...(meta ? { meta } : {}) };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

export default logger;
