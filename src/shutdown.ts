import { sleep } from 'bun';
import { type LoggerFactory, loggerUsingPino, PinoLogger } from './logger.ts';

class ShutdownTimedOutError extends Error {
}

interface ShutdownOptions {
	timeout?: number;
	logger?: LoggerFactory;
}

export function trapShutdown(callback: () => Promise<void>, options?: ShutdownOptions) {
	process.once("SIGINT", () => handleShutdown(callback, options));
	process.once("SIGTERM", () => handleShutdown(callback, options));
}

async function handleShutdown(callback: () => Promise<void>, options?: ShutdownOptions) {
	const envTimeout = process.env.HTML_PDF_EXPORT_TIMEOUT ? parseInt(process.env.HTML_PDF_EXPORT_TIMEOUT) : null;
	const timeout = options?.timeout ?? envTimeout ?? 10_000;
	const logger = options?.logger?.() ?? loggerUsingPino();
	const handleForceExit = forceExit(logger);

	process.on("SIGTERM", handleForceExit);
	process.on("SIGINT", handleForceExit);

	try {
		await Promise.race([
			sleep(timeout).then(() => {
				throw new ShutdownTimedOutError();
			}),
			callback(),
		]);
		process.exit(0);
	} catch (e) {
		if (e instanceof ShutdownTimedOutError) {
			logger.warn("Shutdown handler timed out, quitting forcefully");
		} else {
			logger.error(e, "Error during shutdown handling");
		}
		process.exit(1);
	}
}

function forceExit(logger: PinoLogger) {
	return (signal: number): void => {
		logger.error(`Received second signal ${signal}, exiting NOW`);
		process.exit(1);
	};
}
