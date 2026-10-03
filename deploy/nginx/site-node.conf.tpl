# Modèle nginx pour un site serveur (Nuxt/Nitro) : https://__NAME__.fabrich.site
# Le conteneur n'écoute que sur 127.0.0.1:__PORT__ : seul nginx y accède.
# Généré par deploy/nginx-site.sh, qui remplace __NAME__ et __PORT__.

server {
    listen 80;
    listen [::]:80;
    server_name __NAME__.fabrich.site;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name __NAME__.fabrich.site;

    ssl_certificate     /www/server/panel/vhost/cert/fabrich.site/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/fabrich.site/privkey.pem;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:__PORT__;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    access_log /www/wwwlogs/deplay-__NAME__.log;
    error_log  /www/wwwlogs/deplay-__NAME__.error.log;
}
