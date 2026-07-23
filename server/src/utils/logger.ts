type LogPayload = Record<string, unknown>;

function formatPayload(payload: LogPayload): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    ...payload
  });
}

export const logger = {
  info(payload: LogPayload): void {
    console.log(formatPayload({ level: 'info', ...payload }));
  },

  warn(payload: LogPayload): void {
    console.warn(formatPayload({ level: 'warn', ...payload }));
  },

  error(payload: LogPayload): void {
    console.error(formatPayload({ level: 'error', ...payload }));
  }
};
