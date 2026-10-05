#!/bin/sh
# Route un web service publié vers son port local, ou retire cette route.
# Appelé par le worker via sudo, avec une seule commande autorisée (voir deploy/sudoers.example).
#
#   service-route.sh set    <nom> <port>
#   service-route.sh remove <nom>
#
# Sécurité : le nom et le port sont validés ici ; aucune autre commande n'est possible.
set -eu

NGINX=/www/server/nginx/sbin/nginx
VHOST_DIR=/www/server/panel/vhost/nginx
TEMPLATE=/opt/deplay/deploy/nginx/service.conf.tpl
RESERVED_FILE=/opt/deplay/config/reserved-names.txt

die() { echo "service-route: $*" >&2; exit 1; }

action="${1:-}"
name="${2:-}"

# Même règle que l'API pour le nom
echo "$name" | grep -Eq '^[a-z0-9-]{3,40}$' || die "invalid name: $name"

# Noms réservés : jamais routés par un service (app, www, api…)
if [ -f "$RESERVED_FILE" ] && sed -e 's/#.*//' "$RESERVED_FILE" | tr -s ' \t' '\n' | grep -qx "$name"; then
  die "reserved name: $name"
fi

conf="$VHOST_DIR/deplay-svc-$name.conf"

# Le sous-domaine ne doit pas être servi par une autre configuration
check_not_taken() {
  taken=$(grep -El "server_name[^;]*[[:space:]]$name\.fabrich\.site" "$VHOST_DIR"/*.conf 2>/dev/null | grep -v "/deplay-svc-$name\.conf$" || true)
  [ -z "$taken" ] || die "$name.fabrich.site is already served by: $taken"
}

case "$action" in
  set)
    port="${3:-}"
    echo "$port" | grep -Eq '^(8[1-9][0-9]{2}|9[0-9]{3})$' || die "port must be between 8100 and 9999"
    check_not_taken
    backup=""
    if [ -f "$conf" ]; then backup="$conf.bak"; cp "$conf" "$backup"; fi
    sed -e "s|__NAME__|$name|g" -e "s|__PORT__|$port|g" "$TEMPLATE" > "$conf"
    if "$NGINX" -t >/dev/null 2>&1; then
      "$NGINX" -s reload
      rm -f "$backup"
      echo "routed $name.fabrich.site to port $port"
    else
      if [ -n "$backup" ]; then mv "$backup" "$conf"; else rm -f "$conf"; fi
      die "nginx refused the route for $name; previous state restored"
    fi
    ;;

  remove)
    [ -f "$conf" ] || { echo "nothing to remove for $name"; exit 0; }
    rm -f "$conf"
    "$NGINX" -t >/dev/null 2>&1 || die "nginx test failed after removing $name"
    "$NGINX" -s reload
    echo "removed route for $name"
    ;;

  *)
    die "usage: service-route.sh set <nom> <port> | remove <nom>"
    ;;
esac
