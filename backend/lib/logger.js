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
  base: { app: 'avisander' }
})

module.exports = logger
