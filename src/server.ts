import { file } from 'bun';
import { nanoid } from 'nanoid';
import { mkdir, unlink } from 'node:fs/promises';
import { tmpdir } from 'os';
import { ReadableStream } from "stream/web";
import { htmlToPdfClient, type HtmlToPdfClient } from './html-to-pdf-client.ts';
import { type LoggerFactory, loggerUsingPino, PinoLogger } from './logger.ts';

export interface CreateServerOptions {
	port?: number;
	logger?: LoggerFactory;
	htmlToPdfClient?: HtmlToPdfClient;
}

const convertHtmlToPdf = async(
	requestBody: ReadableStream,
	requestId: string,
	tmpDir: string,
	client: HtmlToPdfClient,
	logger: PinoLogger
) => {
	const outputPath = `${tmpDir}/${requestId}.pdf`;
	const inputPath = `${tmpDir}/${requestId}.html`;

	logger.info(`Writing request body to file: ${inputPath}`);
	await Bun.write(inputPath, await Bun.readableStreamToBlob(requestBody));

	const startTime = process.hrtime();

	await client(inputPath, outputPath, logger);

	const duration = process.hrtime(startTime);
	logger.info(`Done converting HTML to PDF in ${duration}`);

	const pdfOutput = file(outputPath);
	logger.info(`created output size: ${pdfOutput.size}`);

	pdfOutput.stream().getReader().closed.then(async() => {
		await unlink(outputPath);
		await unlink(inputPath);
	});

	return pdfOutput;
};

export const createServer = async(options?: CreateServerOptions) => {
	const port = options?.port ?? 8000;
	const logger = options?.logger?.() ?? loggerUsingPino();
	const client = options?.htmlToPdfClient ?? htmlToPdfClient;

	const tmpDir = process.env.HTML_PDF_EXPORT_TMPDIR ?? tmpdir();
	if (!(await file(tmpDir).exists())) {
		logger.info('Temporary file directory not found, creating a new directory');
		await mkdir(tmpDir, {recursive: true});
	}

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

			const pdfOutput = await convertHtmlToPdf(
				req.body,
				requestId,
				tmpDir,
				client,
				logger,
			);

			return new Response(pdfOutput, {status: 200, headers: {'content-type': 'application/pdf'}});
		},
		error(err) {
			logger.error(err);
			return new Response(null, {status: 500});
		},
	});
};
