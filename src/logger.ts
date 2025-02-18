import pino from 'pino';

export const loggerUsingPino = () => pino({
	name: 'html-pdf-export',
});

export type PinoLogger = typeof pino;
export type LoggerFactory = () => PinoLogger;
