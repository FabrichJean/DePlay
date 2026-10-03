#!/bin/sh
# Installe ou retire la configuration nginx d'un site publié par Deplay.
# Appelé par le worker via sudo, avec une seule commande autorisée (voir deploy/sudoers.example).
#
#   nginx-site.sh install-static <nom> <dossier-racine>
#   nginx-site.sh install-node   <nom> <port>
#   nginx-site.sh remove         <nom>
#
# Sécurité : le nom et le port sont validés ici ; le dossier doit être sous /www/wwwroot/deplay-sites.
set -eu

NGINX=/www/server/nginx/sbin/nginx
VHOST_DIR=/www/server/panel/vhost/nginx
TEMPLATE_DIR=/opt/deplay/deploy/nginx
SITES_ROOT=/www/wwwroot/deplay-sites
# Même liste que l'API : une seule source, lue à chaque appel
RESERVED_FILE=/opt/deplay/config/reserved-names.txt

die() { echo "nginx-site: $*" >&2; exit 1; }

action="${1:-}"
name="${2:-}"

# Nom de projet : même règle que l'API (3 à 40 caractères, minuscules, chiffres, tirets)
echo "$name" | grep -Eq '^[a-z0-9-]{3,40}$' || die "invalid name: $name"

# Noms réservés, lus dans le fichier partagé (commentaires # ignorés)
reserved_names() {
  [ -f "$RESERVED_FILE" ] || return 0
  sed -e 's/#.*//' "$RESERVED_FILE" | tr -s ' \t' '\n' | grep -v '^$' || true
}
if reserved_names | grep -qx "$name"; then
  die "reserved name: $name"
fi

conf="$VHOST_DIR/deplay-$name.conf"

# Vérification dynamique : le sous-domaine ne doit pas déjà être servi par une autre configuration nginx
check_not_taken() {
  taken=$(grep -El "server_name[^;]*[[:space:]]$name\.fabrich\.site" "$VHOST_DIR"/*.conf 2>/dev/null | grep -v "/deplay-$name\.conf$" || true)
  [ -z "$taken" ] || die "$name.fabrich.site is already served by: $taken"
}

# Applique la configuration, la teste, et annule si nginx la refuse
reload_or_rollback() {
  backup="$1"
  if "$NGINX" -t >/dev/null 2>&1; then
    "$NGINX" -s reload
    rm -f "$backup"
  else
    if [ -n "$backup" ] && [ -f "$backup" ]; then mv "$backup" "$conf"; else rm -f "$conf"; fi
    "$NGINX" -t >/dev/null 2>&1 || true
    die "nginx refused the configuration for $name; previous state restored"
  fi
}

case "$action" in
  install-static)
    root="${3:-}"
    case "$root" in
      "$SITES_ROOT"/*) ;;
      *) die "root must be under $SITES_ROOT" ;;
    esac
    [ -d "$root" ] || die "root directory not found: $root"
    check_not_taken
    backup=""
    if [ -f "$conf" ]; then backup="$conf.bak"; cp "$conf" "$backup"; fi
    sed -e "s|__NAME__|$name|g" -e "s|__ROOT__|$root|g" "$TEMPLATE_DIR/site-static.conf.tpl" > "$conf"
    reload_or_rollback "$backup"
    echo "installed static site $name"
    ;;

  install-node)
    port="${3:-}"
    echo "$port" | grep -Eq '^(8[1-9][0-9]{2}|9[0-9]{3})$' || die "port must be between 8100 and 9999"
    check_not_taken
    backup=""
    if [ -f "$conf" ]; then backup="$conf.bak"; cp "$conf" "$backup"; fi
    sed -e "s|__NAME__|$name|g" -e "s|__PORT__|$port|g" "$TEMPLATE_DIR/site-node.conf.tpl" > "$conf"
    reload_or_rollback "$backup"
    echo "installed node site $name on port $port"
    ;;

  remove)
    [ -f "$conf" ] || { echo "nothing to remove for $name"; exit 0; }
    rm -f "$conf"
    "$NGINX" -t >/dev/null 2>&1 || die "nginx test failed after removing $name"
    "$NGINX" -s reload
    echo "removed site $name"
    ;;

  *)
    die "usage: nginx-site.sh install-static <nom> <racine> | install-node <nom> <port> | remove <nom>"
    ;;
esac
