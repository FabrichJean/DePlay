# Déploiement sur le VPS (Ubuntu, Docker, nginx aaPanel)

Ce dossier contient les fichiers à installer sur le VPS. Rien n'est copié automatiquement.

## Architecture

- `https://deplay.fabrich.site` → nginx → application Nuxt sur `127.0.0.1:3100` (`deplay-app.service`).
- `https://<projet>.fabrich.site` → nginx → dossier statique `/www/wwwroot/deplay-sites/<projet>` (un seul bloc nginx, `deploy/nginx/deplay-sites.conf`).
- Le worker (`deplay-worker.service`) construit les projets dans Docker, puis copie le résultat statique dans ce dossier. Il n'appelle plus nginx ni sudo.
- Seuls les sites statiques sont acceptés : Nuxt doit être généré (`nuxt generate`), Next exporté (`output: 'export'`).
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
   Les fichiers `config/reserved-names.txt` et `config/limits.json` doivent être présents dans `/opt/deplay/config/` : ils sont lus par l'application et par le worker.
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
6. **Sites statiques** : créer le dossier servi par nginx, puis installer le bloc unique.
   ```bash
   sudo mkdir -p /www/wwwroot/deplay-sites && sudo chown deplay:deplay /www/wwwroot/deplay-sites
   sudo cp deploy/nginx/deplay-sites.conf /www/server/panel/vhost/nginx/
   sudo /www/server/nginx/sbin/nginx -t && sudo /www/server/nginx/sbin/nginx -s reload
   ```
   Le worker écrit dans ce dossier directement : aucune règle sudo n'est nécessaire pour publier.

   **Migration depuis l'ancien modèle** (un fichier nginx par site) : supprimer les `deplay-<projet>.conf` des sites, en gardant `deplay-app.conf`, puis recharger nginx. Vérifier la liste avant de supprimer :
   ```bash
   ls /www/server/panel/vhost/nginx/deplay-*.conf
   ```
   Puis supprimer uniquement les fichiers des projets (jamais `deplay-app.conf`), recharger, et retirer `/etc/sudoers.d/deplay` si la règle `nginx-site.sh` y est encore.

## Points d'attention

- **Lecture par nginx** : l'utilisateur `www` doit pouvoir lire les dossiers des sites. Le worker donne `755` aux fichiers publiés.
- **Quotas et limites** : `config/limits.json` (700 Mo par compte, 3 builds simultanés, 1 par compte). Chaque build tourne dans un conteneur de 1 CPU et 1 Go.
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
