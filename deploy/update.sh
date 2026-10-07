#!/bin/sh
# Met à jour Deplay sur le VPS depuis origin/main. À lancer en root : sudo /opt/deplay/deploy/update.sh
#
# Options :
#   --no-dep   ne réinstalle pas les dépendances (à utiliser si package.json et package-lock.json n'ont pas changé)
#   --help     affiche cette aide
#
# Règles :
#   - le dépôt du VPS doit être propre : aucune modification faite à la main (sinon le script s'arrête)
#   - ne touche jamais aux données : .env, storage/, prisma/dev.db et les sauvegardes restent hors Git
#   - deploy/ et config/ appartiennent à root (lus en root par les scripts) ; le reste appartient à deplay
#   - build, migrations et client Prisma sont faits en tant que deplay, pour éviter les dossiers créés par root
#
# Étapes : vérification, code, droits, dépendances, client Prisma, build, migrations, site public, redémarrage app (pm2) et worker.
set -eu

NO_DEP=0
for arg in "$@"; do
  case "$arg" in
    --no-dep) NO_DEP=1 ;;
    --help|-h)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "option inconnue : $arg (voir --help)" >&2; exit 2 ;;
  esac
done

APP=/opt/deplay
export PATH=/opt/deplay/bin:/opt/node22/bin:/usr/local/bin:/usr/bin:/bin
RUN_AS_DEPLAY="su -s /bin/sh deplay -c"

cd "$APP"

# Le dépôt appartient à deplay après les droits : git lancé en root doit l'accepter
git config --global --get-all safe.directory 2>/dev/null | grep -qx "$APP" || git config --global --add safe.directory "$APP"

echo "==> vérification du dépôt"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Le dépôt du VPS contient des modifications non commitées :" >&2
  git status --short --untracked-files=no >&2
  echo "Arrêt : commitez ou retirez ces modifications avant de mettre à jour." >&2
  exit 1
fi

echo "==> code"
git fetch --quiet origin main
# Fusion en avant seulement : si le dossier a été modifié à la main, le script s'arrête au lieu d'écraser
git merge --ff-only origin/main
echo "version : $(git log -1 --oneline)"

echo "==> droits"
chown -R deplay:deplay "$APP"
chown -R root:root "$APP/deploy" "$APP/config"
chmod 755 "$APP/deploy/service-route.sh" "$APP/deploy/update.sh"

if [ "$NO_DEP" -eq 1 ]; then
  echo "==> dépendances : ignorées (--no-dep)"
else
  echo "==> dépendances"
  $RUN_AS_DEPLAY "cd $APP && . ./.env && PATH=/opt/node22/bin:\$PATH npm ci --no-audit --no-fund"
fi

echo "==> client Prisma"
$RUN_AS_DEPLAY "cd $APP && . ./.env && PATH=/opt/node22/bin:\$PATH npx prisma generate"

echo "==> build"
$RUN_AS_DEPLAY "cd $APP && . ./.env && PATH=/opt/node22/bin:\$PATH npx nuxi build"

echo "==> migrations"
$RUN_AS_DEPLAY "cd $APP && . ./.env && PATH=/opt/node22/bin:\$PATH npx prisma migrate deploy"

echo "==> site public"
# Landing servie par nginx (deploy/nginx/deplay-landing.conf) : copie des fichiers statiques
LANDING=/www/wwwroot/deplay-landing
mkdir -p "$LANDING"
rm -rf "$LANDING"/*
cp -R "$APP/public/landing-hero-concept/." "$LANDING/"
cp "$APP/public/favicon.svg" "$LANDING/favicon.svg"
chmod -R a+rX "$LANDING"

echo "==> redémarrage"
# reload avec le fichier de configuration : relit .env (pm2 restart ne le relit pas)
pm2 reload deploy/ecosystem.config.cjs --only deplay-app --update-env >/dev/null
systemctl restart deplay-worker

sleep 5
echo "app : HTTP $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3100/)"
echo "worker : $(systemctl is-active deplay-worker)"
