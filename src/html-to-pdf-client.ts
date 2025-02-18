import { spawn, which, file } from 'bun';
import { PinoLogger } from './logger.ts';

export type HtmlToPdfClient = (inputPath: string, outputPath: string, logger: PinoLogger, timeout?: number) => Promise<void>;
export const htmlToPdfClient: HtmlToPdfClient = async (inputPath, outputPath, logger, timeout = 10_000) => {
	const bin = which('wkhtmltopdf');
	if (bin === null) {
		throw new Error('Missing HTML to PDF binary');
	}

	const inputFile = Bun.file(inputPath);
	if (!await inputFile.exists()) {
		throw new Error(`Html for conversion ${inputPath} does not exist or is not readable`)
	}

	const htmlSize = inputFile.size;
	if (htmlSize < 1) {
		throw new Error(`Html file-size for conversion ${inputPath} is smaller than 1 byte`)
	}

	logger.info(`Starting conversion of HTML to PDF from ${inputPath}, size: ${htmlSize}`);

	const proc = spawn(
		['wkhtmltopdf', '--log-level', 'warn', '--print-media-type', '--disable-javascript', '--no-outline', inputPath, outputPath],
		{stderr: 'pipe'},
	);

	const timer = setTimeout(() => {
		proc.kill(129);
		throw new Error(`Timing out after ${timeout} ms while calling wkhtmltopdf, killing the process manually`);
	}, timeout);

	const exitCode = await proc.exited;

	clearTimeout(timer);

	const errors: string = await Bun.readableStreamToText(proc.stderr);
	if (errors) {
		throw new Error(errors);
	}

	// if no errors but unsuccessful exit code, throw a generic error
	if (exitCode !== 0) {
		throw new Error(`Failed to convert HTML to PDF, the process exited with code ${exitCode}`);
	}

	const outputFile = file(outputPath);
	const pdfSize = outputFile.size;
	if (pdfSize < 1) {
		throw new Error(`PDF file-size for conversion ${outputPath} is smaller than 1 byte`)
	}
	logger.info(`created PDF output with size: ${pdfSize}`);
};
