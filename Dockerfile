FROM surnet/alpine-node-wkhtmltopdf:8.11.3-0.12.5-full-font

COPY index.js .

EXPOSE 8000
CMD ["node", "index.js"]
