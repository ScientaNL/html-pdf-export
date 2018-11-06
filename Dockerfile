FROM node:8-alpine

RUN apk add --update --no-cache \
            xvfb \
            ttf-freefont \
            fontconfig \
            dbus \
            libgcc \
            libstdc++ \
            libx11 \
            glib \
            libxrender \
            libxext \
            libintl \
            libcrypto1.0 \
            libssl1.0 \
            ttf-dejavu \
            ttf-droid \
            ttf-freefont \
            ttf-liberation \
            ttf-ubuntu-font-family


COPY wkhtmltopdf /usr/bin/wkhtmltopdf
ENV PATH "$PATH:/usr/bin/wkhtmltopdf"

COPY index.js .

EXPOSE 8000
ENTRYPOINT node index.js