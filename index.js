const http = require('http');
const urlParser = require('url').parse;
const spawn = require('child_process').spawn;
const tempDir = require('os').tmpdir();
const fileSystem = require('fs');

const server = http.createServer((request, response) => {

    const requestPath = urlParser(request.url).pathname;
    generatePdf(request, response);

}).listen(8000);

server.on('error', function (e) {
    console.log(e);
});

const generatePdf = (request, response) => {
    const requestBody = [];
    const clientId = (Math.random() * 0x100000000 + 1).toString(36);

    console.info({
        'timestamp': (new Date).toISOString(),
        'client': clientId,
        'module': 'request',
        'message': 'connected',
    });

    request.on('data', (chunk) => {
        requestBody.push(chunk);
    });

    request.on('end', () => {
        const tempFile = tempDir + '/' + clientId + '.pdf';
        const wkhtmltopdf = spawn('wkhtmltopdf', [
            '--quiet',
            '--print-media-type',
            '--no-outline',
            '-',
            tempFile,
        ]);

        wkhtmltopdf.stdin.end(
            Buffer.concat(requestBody).toString()
        );

        wkhtmltopdf.on('exit', (code) => {
            console.info({
                'timestamp': (new Date).toISOString(),
                'client': clientId,
                'module': 'wkhtmltopdf',
                'message': 'exitted with ' + code,
            });

            if (code !== 0) {
                response.writeHead(500);
                response.end();
                return;
            }

            response.writeHead(200);
            fileSystem.createReadStream(tempFile).pipe(response).on('end', () => {
                fileSystem.unlinkSync(tempFile);
            });
        });

        wkhtmltopdf.stderr.on('data', (chunk) => {
            console.warn({
                'timestamp': (new Date).toISOString(),
                'client': clientId,
                'module': 'wkhtmltopdf',
                'message': chunk.toString(),
            });
        });
    });

    request.on('error', (error) => {
        console.warn({
            'timestamp': (new Date).toISOString(),
            'client': clientId,
            'module': 'request',
            'message': error,
        });

        response.writeHead(400);
        response.end();
    });
};
