# Deplay — document de contexte

Ce document résume l'état du projet pour reprendre le travail sans l'historique de la conversation.
Il ne contient aucun secret : les clés sont dans `.env`, qu'il ne faut ni lire ni afficher.

## 1. Le projet

**Deplay** est une plateforme de déploiement de sites, inspirée de Vercel. L'utilisateur crée un projet
(depuis un dépôt Git ou un upload de fichiers), le worker le construit, puis publie le résultat sur une URL.

- Propriétaire : Fabrich (`hei.fabrich.2@gmail.com`).
- Domaines : `deplay.fabrich.site` = site public (landing, statique via nginx) ; `ondeplay.fabrich.site` = plateforme (application Nuxt) ; chaque site publié a `<projet>.fabrich.site`.
- Projet non versionné par Git (pas de dépôt `.git`).
- Interface en anglais, commentaires de code en français, échanges avec l'utilisateur en français.

## 2. Stack technique

| Élément | Choix |
|---|---|
| Framework | Nuxt 4.4.5 (Nitro 2.13, Vite 7, Vue 3.5) — `srcDir: '.'` (pas de dossier `app/`) |
| Auth | `@clerk/nuxt` 3.1.9 (clés de développement pour l'instant) |
| Base | SQLite via Prisma **6.19** (Prisma 7 non utilisé) — `prisma/dev.db` |
| Worker | Script Node autonome `worker/build-worker.mjs` (hors Nuxt) |
| Node | 22 requis (certaines dépendances l'exigent) |
| Docker | isolation des builds (`BUILD_ISOLATION=docker`) |
| Style | CSS maison, variables dans `assets/css/main.css`, thème bleu |

Commandes :
- `npm run dev` — développement
- `npm run build` puis `node --env-file=.env .output/server/index.mjs` — production locale
- `npm run worker` — worker de build (un processus à part, à garder lancé)
- `npm run db:migrate`, `npm run db:seed`, `npm run db:claim -- user_xxx`

## 3. Architecture

```
Navigateur ──► Nuxt (pages/, components/, API server/api/)
                 │
                 ├── Prisma ──► prisma/dev.db (SQLite)
                 └── storage/projects/<nom>/   (fichiers uploadés)

Worker (processus séparé) ──► lit les déploiements "building" dans la base
   ├── prépare le code : copie storage/ ou git clone (dossier temporaire storage/builds/<nom>-xxxx)
   ├── supprime les liens symboliques
   ├── lance installCommand puis buildCommand (sh -c, dans la racine du projet)
   └── publie : serveur Nitro (.output/server/index.mjs) ou statique, sur 127.0.0.1:<port>
```

Le worker et l'application ne communiquent que par la base de données.

### Modèles Prisma (`prisma/schema.prisma`)

- **Project** : `id`, `ownerId` (identifiant Clerk, nullable), `name` (unique, 3–40 caractères `[a-z0-9-]`),
  `source` (`git` | `upload`), `repository`, `branch`, `preset` (`nuxt|next|vite|static`),
  `rootDirectory`, `installCommand`, `buildCommand`, `outputDirectory`, `fileCount`, `url`, `status`
  (`live|building|attention`), statistiques, `sparkline`.
- **Deployment** : `id`, `projectId` (sans clé étrangère), `status` (`building|deployed|failed`), `url`,
  `buildDir` (dossier publié, pour la reprise après redémarrage), `steps`, `logs`, `info`, `server`, `metrics`
  — ces colonnes complexes sont des chaînes JSON, car SQLite ne gère pas `Json`.

Les enums sont des chaînes validées côté serveur.

## 4. Routes API (`server/api/`)

Toutes exigent une connexion Clerk (401 sinon) et vérifient la propriété du projet (404 si ce n'est pas le sien).

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/projects` | Liste des projets de l'utilisateur + usage (donnée de démo) |
| POST | `/api/projects/website` | Création (JSON pour Git, multipart pour upload). Crée le projet, écrit les fichiers, crée le premier déploiement |
| GET | `/api/projects/[id]` | Détail d'un projet |
| DELETE | `/api/projects/[id]` | Supprime projet, déploiements et fichiers (le worker arrête le site, voir §6) |
| GET | `/api/projects/[id]/deployment` | Dernier déploiement du projet |
| POST | `/api/projects/[id]/redeploy` | Crée un déploiement en attente (409 si un build est en cours) |
| GET | `/api/deployments/[id]` | Détail d'un déploiement (propriété vérifiée via le projet) |
| POST | `/api/projects/[id]/upload` | Nouvelle version des fichiers d'un site uploadé (archive zip) + déploiement — utilisé par la CLI |
| GET | `/api/cli/whoami` | Vérification du jeton par la CLI |
| GET / POST | `/api/tokens` | Jetons CLI de l'utilisateur — **session Clerk uniquement** |
| DELETE | `/api/tokens/[id]` | Révocation d'un jeton CLI — session Clerk uniquement |

**Jetons CLI** : `Authorization: Bearer dpl_…` est résolu par `server/middleware/api-token.ts` (empreinte SHA-256
dans la table `ApiToken`) ; `requireUser` accepte alors le jeton à la place de la session. La CLI elle-même est
dans `cli/` (paquet npm `deplay-cli`, publié séparément).

Utilitaires serveur importants (`server/utils/`) : `require-user.ts`, `owner.ts` (`currentUserId`, `assertOwner`),
`db.ts` (client Prisma), `project-mapper.ts`, `deployment-mapper.ts`, `initial-deployment.ts`,
`project-storage.ts` (écriture des uploads, avec refus des chemins `..`), `workspace-usage.ts` (usage réel : stockage, trafic et visites des 14 derniers jours).

Limite d'upload : **200 Mo** (constante dans la route et dans le formulaire).

## 5. Pages et composants

- `pages/index.vue` — liste des projets (grille/liste, filtres, recherche) ; landing si non connecté (`components/landing/LandingHero.vue`).
- `pages/new/website.vue` — assistant de création en 3 étapes (`components/website/` : `WizardStepper`, `StepRepository`, `StepConfigure`, `StepReview`).
  Après création, redirection vers `/projects/<id>`.
- `pages/projects/[id].vue` — détail du projet : dernier déploiement (`DeploymentDetails` en mode `compact`), bouton Redeploy, rafraîchissement toutes les 3 s pendant un build.
- `pages/deployments/[id].vue` — détail d'un déploiement (mise en page complète avec colonne latérale).
- `components/projects/ProjectMenu.vue` — menu « … » des cartes : Visit, Manage, Redeploy, Delete (avec confirmation).
- `layouts/default.vue` — sidebar et barre supérieure seulement si connecté ; `AppTopbar` contient les boutons Clerk.
- `constants/reserved-names.ts` — noms de projet interdits (`deplay`, `app`, `www`, `mail`, `api`, `ftp`, `admin`, `static`, `assets`, `epta`…). Ce fichier a été modifié par l'utilisateur ; il faut garder son contenu.

## 6. Le worker (`worker/build-worker.mjs`)

- Boucle toutes les 3 s : traite le plus ancien déploiement `building`.
- Au démarrage : **reprend** les sites `deployed` (dossier `buildDir` ou déduit des logs), en gardant le même port quand c'est possible. Ne republie que le plus récent de chaque projet.
- À chaque cycle : **arrête** les sites dont le déploiement a été supprimé en base, et supprime leur dossier.
- Redéploiement : arrête l'ancien site du projet, réutilise son port, publie le nouveau, puis supprime les anciens dossiers de build.
- Un dossier uploadé qui contient un seul sous-dossier est « remonté » à la racine (`flattenSingleFolder`).
- Environnement minimal pour les commandes (`buildEnv()` : PATH, HOME, LANG, CI, GIT_TERMINAL_PROMPT) — pas de secrets.
- Liens symboliques supprimés après la préparation ; le serveur statique refuse de servir un fichier dont le chemin réel sort du dossier publié.
- Variable `WORKER_ONLY_DEPLOYMENT_ID` : ne traite qu'un déploiement (tests).
- Variable `DEPLOY_WORK_DIR` : dossier de build (par défaut `storage/builds`).
- Timeout de commande : 10 minutes.

**Limite majeure** : les commandes du projet tournent directement sur la machine, avec les droits de l'utilisateur
(`sh -c`). Un script malveillant peut lire les fichiers de la machine. Voir §8.


**Modes de l'URL** (variable `SITE_MODE`) :
- `port` (développement local) : `http://localhost:<port>`, serveur Node local.
- `subdomain` (VPS) : `https://<nom>.fabrich.site`. Site statique copié dans `DEPLOY_SITES_DIR/<nom>` (lecture pour `www`), serveur Nitro sur un port 8100–9999, puis `sudo -n nginx-site.sh install-static|install-node`. Le worker supprime aussi les configurations nginx des projets supprimés (`cleanupOrphanSites`).

**Isolation** (`BUILD_ISOLATION`) : `docker` par défaut (clone, install et build dans un conteneur, sans secret) ; `none` uniquement en local.

## 7. Décisions et contraintes

- **Développement sur Mac, production sur VPS Ubuntu** avec Docker. Le même code doit tourner partout ; seule la configuration change.
- Le worker ne doit jamais tourner en root. Ne pas donner au groupe `docker` les droits d'un utilisateur sans contrôle (équivalent root) : préférer Docker rootless.
- Les sites publiés ne doivent pas être exposés par port : **sous-domaine + nginx**.
- Les fichiers stockés ne doivent pas être lus ni affichés par l'agent (`storage/` peut contenir des projets entiers).
- Ne pas exécuter de `git commit` ou de `git push` sans demande explicite (le projet n'est pas un dépôt git actuellement).
- Ne pas modifier les fichiers que l'utilisateur a changés sur le disque sans le signaler.
- Les diagnostics de l'éditeur (`Cannot find name 'ref'`, `~/types/...`) sont normaux : les auto-imports Nuxt ne sont connus qu'après un build. Vérifier par `npx nuxi build`.

## 8. Sécurité : état

**Fait**
- Routes privées protégées par Clerk ; propriété des projets (`ownerId`), 404 pour un projet d'un autre utilisateur.
- Builds dans Docker (`BUILD_ISOLATION=docker`) : conteneur sans privilèges, système de fichiers en lecture seule, seul le dossier de build monté, limites de mémoire, CPU et processus.
- Environnement minimal pour le code du projet (`buildEnv()`), sans secret du worker.
- Liens symboliques supprimés après la préparation ; service statique qui refuse les chemins réels hors du dossier publié.
- Chemins d'upload validés (pas de `..`), limite de 200 Mo, dossiers inutiles exclus.
- Noms réservés lus dans `config/reserved-names.txt` (source unique, à la création et dans `nginx-site.sh`), plus une vérification nginx à l'exécution.

**À faire**
1. Limiter le réseau du conteneur de build (aucune restriction pour l'instant : accès Internet complet).
2. `npm ci --ignore-scripts` si le projet n'en a pas besoin.
3. En-têtes de sécurité : déjà présents dans les modèles nginx (`nosniff`, `SAMEORIGIN`, `Referrer-Policy`) ; reste à évaluer une CSP.
4. Filtrer jetons et clés dans les logs enregistrés.
5. Quotas de taille par projet et par utilisateur.
6. Docker rootless pour l'utilisateur `deplay` (le groupe `docker` équivaut à root) : étape séparée, non commencée.

## 9. Déploiement VPS

**Serveur** : Ubuntu, Docker 29 (mode classique), nginx géré par aaPanel (`/www/server/nginx`, vhosts dans `/www/server/panel/vhost/nginx/`). Domaine `fabrich.site`.

**Vérifié**
- Certificat `fabrich.site` couvrant `*.fabrich.site` : pas de certificat par projet.
- Ports 3100 (application) et 8100–9999 (sites serveur) libres.
- Utilisateur `deplay` créé (uid 997, nologin, hors du groupe docker).
- `/opt/deplay` : `prisma/`, `storage/projects/`, `.env` (600, deplay), `config/`, `deploy/` (propriété root).
- `/www/wwwroot/deplay-sites` : deplay:www, 755.
- Règle sudo : `deplay ALL=(root) NOPASSWD: /opt/deplay/deploy/nginx-site.sh`.
- `deplay-app.conf` copié dans vhost ; `nginx -t` OK ; **nginx non rechargé**.
- Unités systemd copiées dans `/etc/systemd/system/`, **non activées**.
- Règle ufw 3100/tcp supprimée (inutile).

**Problèmes connus**
- `/opt/deplay/deploy` et `config/` appartiennent à `deplay` : il pouvait remplacer le script exécuté en root. Correction recommandée : `/opt/deplay` en `root:root`, avec `deplay` propriétaire seulement de `prisma/` et `storage/`. Un `chattr +i` a été posé en attendant.
- SSH : authentification par mot de passe et `PermitRootLogin yes` encore actifs. Ne pas désactiver avant une connexion par clé testée dans une deuxième session. `99-tunnel.conf` configure des tunnels inverses (ports 4000 et 9865).
- Le `.env` du VPS pointait vers `/www/wwwroot/DePlay` au lieu de `/opt/deplay`, et contenait des clés de test. Une clé secrète a été montrée en clair dans une capture : elle doit être régénérée.
- `.output` (build de l'application) et `worker/` ne sont pas encore dans `/opt/deplay`.
- Docker rootless non installé. Le worker ne doit pas démarrer tant que Docker n'est pas prêt.

**Procédure** : [deploy/README.md](deploy/README.md). Modèle de configuration : [deploy/env.example](deploy/env.example).

## 10. État fonctionnel

**Fonctionne (vérifié par tests API, build ou test de worker)**
- Création de projets Git et upload, avec premier déploiement en attente.
- Worker en mode `port` : build statique, publication, échec propre, reprise au redémarrage, arrêt à la suppression, port conservé au redéploiement, nettoyage des anciens builds, non-régression après les modifications de mode.
- Isolation Docker présente dans le code (non testée sur cette machine : Docker installé mais non démarré).
- Routes privées refusent les appels non connectés (401).

**Non testé**
- Mode `subdomain` : demande sudo et nginx sur le VPS.
- Parcours complet dans le navigateur avec session Clerk, et propriété entre deux comptes.

**Limites connues**
- Les sites publiés dépendent du worker : arrêt du worker = sites arrêtés (repris au redémarrage).
- Seuls les sites Nuxt (serveur Nitro) et statiques sont pris en charge.
- Dépôts Git publics uniquement.
- Le contenu du CMS (`eptaadmin-prefetch`) est figé au moment du build.
- Un redéploiement d'upload réutilise les fichiers stockés.
- Usage du workspace et statistiques : données de démo.
- Les projets sans propriétaire sont invisibles jusqu'à `npm run db:claim -- user_xxx`.
- Risque : si le worker du VPS pointe vers une autre base, le nettoyage des configurations nginx supprimera les sites en ligne.

## 11. Données de test

- Base seedée : 6 projets de démo, et un déploiement `todo-maaster` lié à `fabrich-profile`. Relancer `npm run db:seed` est sans risque.
- Projets utilisateur présents : `mada`, `finalmada` (déployés localement). Leur dossier de build peut être supprimé par un redéploiement.
- Ne pas laisser de projets de test (`worker-test`, `delete-port-test`, etc.) : ils ont été supprimés.
- Ne jamais lancer `pkill -f worker/build-worker.mjs` : cela arrête aussi le worker de l'utilisateur. Cibler le PID avec la variable `WORKER_ONLY_DEPLOYMENT_ID` dans `ps eww`.

## 12. Fichiers à connaître

- `nuxt.config.ts` — `srcDir`, `runtimeConfig.projectsStorageDir`, exclusions de surveillance (`storage/`, `worker/`, `prisma/*.db*`) : sans elles, `spawn EBADF`.
- `.env` — `DATABASE_URL` (chemin absolu), `NUXT_PROJECTS_STORAGE_DIR` (chemin absolu), clés Clerk et CMS. **Ne pas afficher.**
- `prisma/seed.mjs` — démo + rattrapage des déploiements initiaux.
- `prisma/claim.mjs` — rattachement des projets sans propriétaire.
- `components/deployment/DeploymentLogs.vue` — terminal (hauteur fixe, auto-scroll).
- `components/deployment/DeploymentDetails.vue` — détail partagé, mode `compact` pour la page projet.
