FROM node:8-alpine

RUN apk add --update --no-cache \
            xvfb \
            libgcc \
            libstdc++ \
            libx11 \
            glib \
            libxrender \
            libxext \
            libintl \
            libcrypto1.0 \
            libssl1.0 \
            ttf-opensans

# We use a pre-compiled version of wkhtmltopdf because there are no Alpine binaries available on https://wkhtmltopdf.org/downloads.html
# There is a version of wkhtml in alpine's git repository, but it is in the testing directory, so we don't want to reference that.
# This binary's build steps were configured by https://github.com/alloylab/Docker-Alpine-wkhtmltopdf including qt patches
COPY wkhtmltopdf /usr/bin/wkhtmltopdf
ENV PATH "$PATH:/usr/bin/wkhtmltopdf"

COPY index.js .

EXPOSE 8000
CMD ["node", "index.js"]