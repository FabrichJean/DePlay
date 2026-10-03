# Modèle nginx pour un site statique publié : https://__NAME__.fabrich.site
# Généré par deploy/nginx-site.sh, qui remplace __NAME__ et __ROOT__.
# __ROOT__ doit être un dossier lisible par l'utilisateur nginx (www).

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

    root __ROOT__;
    index index.html;

    # Un site publié ne doit pas pouvoir lister ses dossiers ni servir des fichiers cachés
    autoindex off;
    location ~ /\. {
        deny all;
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    access_log /www/wwwlogs/deplay-__NAME__.log;
    error_log  /www/wwwlogs/deplay-__NAME__.error.log;
}
