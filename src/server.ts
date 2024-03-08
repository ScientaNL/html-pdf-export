import { file } from 'bun';
import { nanoid } from 'nanoid';
import { mkdir, unlink } from 'node:fs/promises';
import { tmpdir } from 'os';
import { htmlToPdfClient, type HtmlToPdfClient } from './html-to-pdf-client.ts';
import { type Logger, loggerUsingPino } from './logger.ts';

export interface CreateServerOptions {
	port?: number;
	logger?: Logger;
	htmlToPdfClient?: HtmlToPdfClient;
}

export const createServer = (options?: CreateServerOptions) => {
	const port = options?.port ?? 8000;
	const logger = options?.logger?.() ?? loggerUsingPino();
	const client = options?.htmlToPdfClient ?? htmlToPdfClient;

	logger.info(`Listening on port ${port}...`);

	return Bun.serve({
		port,
		async fetch(req) {
			const requestId = nanoid();
			logger.child({requestId});

			if (req.method !== 'POST') {
				logger.error('Invalid request method');
				return new Response(null, {status: 405});
			}

			if (!req.body) {
				logger.error('Missing request body');
				return new Response(null, {status: 400});
			}

			if (!req.headers.has('content-type')) {
				logger.error('Missing content-type request header');
				return new Response(null, {status: 400});
			}

			if (req.headers.get('content-type') !== 'text/html') {
				logger.error('Invalid content-type request header');
				return new Response(null, {status: 400});
			}

			const tmpDir = process.env.HTML_PDF_EXPORT_TMPDIR ?? tmpdir();
			if (!(await file(tmpDir).exists())) {
				logger.info('Temporary file directory not found, creating a new directory');
				await mkdir(tmpDir, {recursive: true});
			}

			const outputPath = `${tmpDir}/${requestId}.pdf`;
			const contentLength = req.headers.get('content-length');
			logger.info('Starting conversion of HTML to PDF', {contentLength});
			const startTime = process.hrtime();
			await client(req, outputPath);
			const duration = process.hrtime(startTime);
			logger.info('Done converting HTML to PDF', {contentLength, duration});

			const output = file(outputPath);
			output.stream().getReader().closed.then(() => unlink(outputPath));
			return new Response(output, {status: 200, headers: {'content-type': 'application/pdf'}});
		},
		error(err) {
			logger.error(err);
			return new Response(null, {status: 500});
		},
	});
};
