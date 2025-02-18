FROM oven/bun:1-alpine as base
WORKDIR /usr/src/app

FROM base AS install
# Install all dependencies
RUN mkdir -p /temp/all
COPY package.json bun.lockb /temp/all/
RUN cd /temp/all && bun install --frozen-lockfile
# Install prod dependencies
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/all/node_modules node_modules
COPY . .

FROM surnet/alpine-wkhtmltopdf:3.19.0-0.12.6-small as wkhtmltopdf

FROM base AS release
RUN apk add --no-cache \
        libstdc++ \
        libx11 \
        libxrender \
        libxext \
        libssl3 \
        ca-certificates \
        fontconfig \
        freetype \
    	ttf-dejavu \
        ttf-droid \
        ttf-freefont \
        ttf-liberation
COPY --from=wkhtmltopdf /bin /usr/local/bin
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/src .
COPY --from=prerelease /usr/src/app/package.json .

USER bun
EXPOSE 8000/tcp
CMD ["bun", "run", "index.ts"]
