import { createServer } from './server.ts';
import { trapShutdown } from './shutdown.ts';

const server = createServer();

trapShutdown(async () => server.stop());
