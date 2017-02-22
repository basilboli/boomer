#!/bin/sh
echo "start nginx"

#setup ssl keys
echo "ssl_key=${SSL_KEY:=boomer-key.pem}, ssl_cert=${SSL_CERT:=boomer-crt.pem}"
SSL_KEY=/etc/nginx/ssl/${SSL_KEY}
SSL_CERT=/etc/nginx/ssl/${SSL_CERT}
sed -i "s|BOOMER_KEY|${SSL_KEY}|g" /etc/nginx/conf.d/boomer.conf
sed -i "s|BOOMER_CERT|${SSL_CERT}|g" /etc/nginx/conf.d/boomer.conf

if [ ! -f /etc/nginx/ssl/dhparams.pem ]; then
    echo "make dhparams"
    cd /etc/nginx/ssl
    openssl dhparam -out dhparams.pem 2048
    chmod 600 dhparams.pem
fi

cp -f /robots.txt /srv/docroot/robots.txt

#disable ssl configuration and let it run without SSL
mv -v /etc/nginx/conf.d/boomer.conf /etc/nginx/conf.d/boomer.disabled

(
 sleep 5 #give nginx time to start
 echo "start letsencrypt updater"
 while :
 do
    echo "trying to update letsencrypt ..."
    /le.sh
    rm -f /etc/nginx/conf.d/default.conf 2>/dev/null #remove default config, conflicting on 80
    mv -v /etc/nginx/conf.d/boomer.disabled /etc/nginx/conf.d/boomer.conf #enable
    echo "reload nginx with ssl"
    nginx -s reload
    sleep 60d
 done
) &

nginx -g "daemon off;"