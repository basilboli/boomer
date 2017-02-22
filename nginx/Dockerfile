FROM nginx:stable-alpine

ADD conf/nginx.conf /etc/nginx/nginx.conf
ADD conf/boomer.conf /etc/nginx/conf.d/boomer.conf
ADD conf/robots.txt /robots.txt

ADD script/entrypoint.sh /entrypoint.sh
ADD script/le.sh /le.sh

RUN \
 rm /etc/nginx/conf.d/default.conf && \
 chmod +x /entrypoint.sh && \
 chmod +x /le.sh && \
 apk add  --update certbot tzdata openssl && \
 rm -rf /var/cache/apk/*

CMD ["/entrypoint.sh"]
