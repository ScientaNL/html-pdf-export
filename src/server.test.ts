import { write } from 'bun';
import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import pino, { type Logger, type LoggerExtras } from 'pino';
import type { HtmlToPdfClient } from './html-to-pdf-client.ts';
import { createServer } from './server.ts';

mock.module('nanoid', () => ({nanoid: () => 'fake-random-id'}));

const port = 0; // 0 means give a random unassigned port
const host = 'http://localhost';
const method = 'POST';
const body = "<h1>Hello world</h1>";
const headers = {'content-type': 'text/html'};
const logger = {
	info: mock() as pino.LogFn,
	error: mock() as pino.LogFn,
	child: mock() as LoggerExtras['child'],
} as Logger;
const htmlToPdfClient: HtmlToPdfClient = async (req, outputPath) => {
	const html = await req.text();
	await write(outputPath, html);
};

let server: ReturnType<typeof createServer>;
beforeEach(() => server = createServer({port, htmlToPdfClient, logger: () => logger}));
afterEach(() => server.stop());

test('logs request id', async () => {
	await server.fetch(new Request(host));
	expect(logger.child).toHaveBeenCalledWith({requestId: 'fake-random-id'});
});

const invalidRequestMethods = ['GET', 'HEAD', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'];
test.each(invalidRequestMethods)('cannot do %s requests', async method => {
	const res = await server.fetch(new Request(host, {method}));
	expect(res.status).toBe(405);
	expect(logger.error).toHaveBeenCalledWith('Invalid request method');
});

test('requires a request body', async () => {
	const res = await server.fetch(new Request(host, {method}));
	expect(res.status).toBe(400);
	expect(logger.error).toHaveBeenCalledWith('Missing request body');
});

test('requires a content-type request header', async () => {
	const res = await server.fetch(new Request(host, {method, body}));
	expect(res.status).toBe(400);
	expect(logger.error).toHaveBeenCalledWith('Missing content-type request header');
});

test('requires a request with text/html content-type header', async () => {
	const res = await server.fetch(new Request(host, {method, body, headers: {'content-type': ''}}));
	expect(res.status).toBe(400);
	expect(logger.error).toHaveBeenCalledWith('Invalid content-type request header');
});

test('success', async () => {
	const res = await server.fetch(new Request(host, {method, body, headers}));
	expect(res.status).toBe(200);
	expect(await res.text()).toBe(body);
	expect(res.headers.get('content-type')).toBe('application/pdf');
});
