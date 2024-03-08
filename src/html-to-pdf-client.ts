import { spawn, which } from 'bun';

export type HtmlToPdfClient = (req: Request, outputPath: string) => Promise<void>;
export const htmlToPdfClient: HtmlToPdfClient = async (req, outputPath) => {
	const bin = which('wkhtmltopdf');
	if (bin === null) {
		throw new Error('Missing HTML to PDF binary');
	}
	const proc = spawn(
		['wkhtmltopdf', '--quiet', '--print-media-type', '--no-outline', '-', outputPath],
		{stdin: req, stderr: 'pipe'},
	);

	const exitCode = await proc.exited;
	const errors: string = await Bun.readableStreamToText(proc.stderr);
	if (errors) {
		throw new Error(errors);
	}

	// if no errors but unsuccessful exit code, throw a generic error
	if (exitCode !== 0) {
		throw new Error(`Failed to convert HTML to PDF, the process exited with code ${exitCode}`);
	}
};
