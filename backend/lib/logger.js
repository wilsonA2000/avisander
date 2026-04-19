const pino = require('pino')

const isProd = process.env.NODE_ENV === 'production'

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' }
      },
  base: { app: 'avisander' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-bold-signature"]',
      'req.headers["x-bold-identity-key"]',
      'req.body.password',
      'req.body.new_password',
      'req.body.current_password',
      'req.body.token',
      'req.body.refreshToken',
      'req.body.refresh_token',
      'res.headers["set-cookie"]',
      '*.password',
      '*.password_hash',
      '*.token',
      '*.refreshToken',
      '*.refresh_token',
      '*.secret',
      '*.apiKey',
      '*.api_key'
    ],
    censor: '[REDACTED]'
  }
})

module.exports = logger
