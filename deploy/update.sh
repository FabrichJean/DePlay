#!/bin/sh
# Met à jour Deplay sur le VPS depuis origin/main. À lancer en root : sudo /opt/deplay/deploy/update.sh
#
# Options :
#   --no-dep   ne réinstalle pas les dépendances (à utiliser si package.json et package-lock.json n'ont pas changé)
#   --help     affiche cette aide
#
# Ne touche jamais aux données : .env, storage/, prisma/dev.db et node_modules/.output sont ignorés par Git.
# Étapes : récupération du code, dépendances, build (Node 22), migrations, redémarrage app (pm2) et worker (systemd).
set -eu

NO_DEP=0
for arg in "$@"; do
  case "$arg" in
    --no-dep) NO_DEP=1 ;;
    --help|-h)
      sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "option inconnue : $arg (voir --help)" >&2; exit 2 ;;
  esac
done

APP=/opt/deplay
export PATH=/opt/deplay/bin:/opt/node22/bin:/usr/local/bin:/usr/bin:/bin

cd "$APP"

echo "==> code"
git fetch --quiet origin main
# Fusion en avant seulement : si le dossier a été modifié à la main, le script s'arrête au lieu d'écraser
git merge --ff-only origin/main
echo "version : $(git log -1 --oneline)"

if [ "$NO_DEP" -eq 1 ]; then
  echo "==> dépendances : ignorées (--no-dep)"
else
  echo "==> dépendances"
  npm ci --no-audit --no-fund
fi

echo "==> build"
set -a
. "$APP/.env"
set +a
npx nuxi build

echo "==> migrations (en tant que deplay)"
su -s /bin/sh deplay -c "cd $APP && PATH=/opt/node22/bin:\$PATH node_modules/.bin/prisma migrate deploy"

echo "==> redémarrage"
pm2 restart deplay-app
systemctl restart deplay-worker

sleep 5
echo "app : HTTP $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3100/)"
echo "worker : $(systemctl is-active deplay-worker)"
