#!/usr/bin/env bash
curl http://localhost:8000 -H 'Content-Type: text/html' -d '<html><body><h1>Hello world from SHELL</h1></body></html>' > "$(dirname $0)/test.pdf"
