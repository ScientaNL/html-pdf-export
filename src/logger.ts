import pino, { type Logger as PinoLogger } from 'pino';

export const loggerUsingPino = () => pino({
	name: 'html-pdf-export',
});

export type Logger = () => PinoLogger;
