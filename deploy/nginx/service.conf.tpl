# Modèle nginx pour un web service : https://__NAME__.fabrich.site vers 127.0.0.1:__PORT__
# Généré par deploy/service-route.sh, qui remplace __NAME__ et __PORT__.

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

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:__PORT__;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Connexions WebSocket : elles restent ouvertes longtemps sans trafic
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    access_log /www/wwwlogs/sites/deplay-__NAME__.log combined;
    error_log  /www/wwwlogs/deplay-__NAME__.error.log;
}
