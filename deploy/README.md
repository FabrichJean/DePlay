# Déploiement sur le VPS (Ubuntu, Docker, nginx aaPanel)

Ce dossier contient les fichiers à installer sur le VPS. Rien n'est copié automatiquement.

## Architecture

- `https://deplay.fabrich.site` → nginx → application Nuxt sur `127.0.0.1:3100` (`deplay-app.service`).
- `https://<projet>.fabrich.site` → nginx → dossier statique, ou serveur Nitro sur `127.0.0.1:8100-9999`.
- Le worker (`deplay-worker.service`) construit les projets dans Docker, puis appelle `nginx-site.sh` via sudo.
- Certificat : le wildcard de `fabrich.site` couvre `*.fabrich.site`, aucun certificat par projet.

## Installation (une fois)

1. **Utilisateur dédié**
   ```bash
   sudo useradd --system --create-home --shell /usr/sbin/nologin deplay
   sudo usermod -aG docker deplay   # voir la note sur Docker rootless ci-dessous
   ```
2. **Fichiers** : copier le projet dans `/opt/deplay` (sans `node_modules` ni `storage/`), puis
   ```bash
   cd /opt/deplay && sudo -u deplay npm ci && sudo -u deplay npm run build
   sudo -u deplay npx prisma migrate deploy
   ```
   Le fichier `config/reserved-names.txt` doit aussi être présent dans `/opt/deplay/config/` : il est lu à la fois par l'application et par `nginx-site.sh`.
3. **Secrets** : créer `/opt/deplay/.env` (clés Clerk de production, `DATABASE_URL`, `NUXT_PROJECTS_STORAGE_DIR=/opt/deplay/storage/projects`, clés CMS), puis
   ```bash
   sudo chown deplay:deplay /opt/deplay/.env && sudo chmod 600 /opt/deplay/.env
   ```
4. **Services systemd**
   ```bash
   sudo cp deploy/systemd/*.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now deplay-app deplay-worker
   ```
5. **nginx**
   ```bash
   sudo cp deploy/nginx/deplay-app.conf /www/server/panel/vhost/nginx/
   sudo /www/server/nginx/sbin/nginx -t && sudo /www/server/nginx/sbin/nginx -s reload
   ```
6. **Droits du worker sur nginx** : copier `deploy/nginx-site.sh` dans `/opt/deplay/deploy/`, le rendre exécutable pour root uniquement, et ajouter la règle de `deploy/sudoers.example` dans `/etc/sudoers.d/deplay`.
7. **Dossier des sites statiques** : créer `/www/wwwroot/deplay-sites` (propriétaire `deplay`, lisible par `www`).

## Points d'attention

- **Lecture par nginx** : l'utilisateur `www` doit pouvoir lire les dossiers des sites statiques. Les builds du worker sont créés avec des droits `700` : il faut les publier dans `/www/wwwroot/deplay-sites/<nom>` en `755` (modification du worker à faire).
- **Docker** : le groupe `docker` équivaut à des droits root. Préférer **Docker rootless** pour l'utilisateur `deplay`.
- **Ports** : 3000 (todo), 3001 (webhook), 3334 (epta), 8091 (déploiement madascribe), 8888 (android-builder) sont déjà utilisés. Ne pas les attribuer aux projets.
- **Clerk** : ajouter `https://deplay.fabrich.site` aux origines autorisées du tableau de bord Clerk.
- **Sauvegardes** : `/opt/deplay/prisma/dev.db` et `/opt/deplay/storage/projects` (les fichiers uploadés).

## Vérifications

```bash
systemctl status deplay-app deplay-worker
curl -I https://deplay.fabrich.site
sudo /www/server/nginx/sbin/nginx -t
```
