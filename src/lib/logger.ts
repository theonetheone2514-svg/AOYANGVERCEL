type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: unknown
  error?: { message: string; stack?: string }
}

function log(level: LogLevel, message: string, data?: unknown, err?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data !== undefined && { data }),
    ...(err instanceof Error && { error: { message: err.message, stack: err.stack } }),
  }

  const output = JSON.stringify(entry)

  switch (level) {
    case 'error':
      console.error(output)
      break
    case 'warn':
      console.warn(output)
      break
    case 'debug':
      if (process.env.NODE_ENV !== 'production') console.debug(output)
      break
    default:
      console.log(output)
  }
}

export const logger = {
  info: (message: string, data?: unknown) => log('info', message, data),
  warn: (message: string, data?: unknown) => log('warn', message, data),
  error: (message: string, error?: unknown, data?: unknown) => log('error', message, data, error),
  debug: (message: string, data?: unknown) => log('debug', message, data),
}
