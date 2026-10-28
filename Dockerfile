# Build and test the selected application's out/ directory before packaging.
FROM nginx:1.30.6-alpine@sha256:47928bf67eb62a1863cb08d9ecb52d3e704304ba614eaee17884204677702951

ARG RELEASE_SHA
ARG WEB_APP=pdf-web
LABEL org.opencontainers.image.source="https://github.com/ljh12138164/folioforge"
LABEL org.opencontainers.image.revision=$RELEASE_SHA

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/${WEB_APP}/out/ /usr/share/nginx/html/
RUN printf '%s' "$RELEASE_SHA" | grep -Eq '^[0-9a-f]{40}$' \
    && case "$WEB_APP" in pdf-web) test -f /usr/share/nginx/html/pdf-sw.js ;; image-web) test -f /usr/share/nginx/html/convert/index.html ;; *) exit 1 ;; esac \
    && test -f /usr/share/nginx/html/guide/index.html \
    && printf '%s\n' "$RELEASE_SHA" > /usr/share/nginx/html/release.txt

EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
