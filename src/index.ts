import { createServer } from './server.ts';
import { trapShutdown } from './shutdown.ts';

const server = await createServer();

trapShutdown(async () => server.stop());
