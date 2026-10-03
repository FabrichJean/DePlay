# Deplay — document de contexte

Ce document résume l'état du projet pour reprendre le travail sans l'historique de la conversation.
Il ne contient aucun secret : les clés sont dans `.env`, qu'il ne faut ni lire ni afficher.

## 1. Le projet

**Deplay** est une plateforme de déploiement de sites, inspirée de Vercel. L'utilisateur crée un projet
(depuis un dépôt Git ou un upload de fichiers), le worker le construit, puis publie le résultat sur une URL.

- Propriétaire : Fabrich (`hei.fabrich.2@gmail.com`).
- Domaine prévu : `deplay.fabrich.site` pour l'application ; chaque site publié aura `<projet>.fabrich.site`.
- Projet non versionné par Git (pas de dépôt `.git`).
- Interface en anglais, commentaires de code en français, échanges avec l'utilisateur en français.

## 2. Stack technique

| Élément | Choix |
|---|---|
| Framework | Nuxt 4.4.5 (Nitro 2.13, Vite 7, Vue 3.5) — `srcDir: '.'` (pas de dossier `app/`) |
| Auth | `@clerk/nuxt` 3.1.9 (clés de développement pour l'instant) |
| Base | SQLite via Prisma **6.19** (Prisma 7 non utilisé) — `prisma/dev.db` |
| Worker | Script Node autonome `worker/build-worker.mjs` (hors Nuxt) |
| Node | 22 recommandé (certaines dépendances l'exigent) ; 20.20 déclenche des avertissements |
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

Utilitaires serveur importants (`server/utils/`) : `require-user.ts`, `owner.ts` (`currentUserId`, `assertOwner`),
`db.ts` (client Prisma), `project-mapper.ts`, `deployment-mapper.ts`, `initial-deployment.ts`,
`project-storage.ts` (écriture des uploads, avec refus des chemins `..`), `mock-projects.ts` (usage factice).

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

## 7. Décisions et contraintes

- **Développement sur Mac, production sur VPS Ubuntu** avec Docker. Le même code doit tourner partout ; seule la configuration change.
- Le worker ne doit jamais tourner en root. Ne pas donner au groupe `docker` les droits d'un utilisateur sans contrôle (équivalent root) : préférer Docker rootless.
- Les sites publiés ne doivent pas être exposés par port : **sous-domaine + nginx**.
- Les fichiers stockés ne doivent pas être lus ni affichés par l'agent (`storage/` peut contenir des projets entiers).
- Ne pas exécuter de `git commit` ou de `git push` sans demande explicite (le projet n'est pas un dépôt git actuellement).
- Ne pas modifier les fichiers que l'utilisateur a changés sur le disque sans le signaler.
- Les diagnostics de l'éditeur (`Cannot find name 'ref'`, `~/types/...`) sont normaux : les auto-imports Nuxt ne sont connus qu'après un build. Vérifier par `npx nuxi build`.

## 8. Sécurité : état et plan

**Fait**
- Routes privées protégées par Clerk ; propriété des projets (`ownerId`).
- Environnement minimal pour le code du projet.
- Liens symboliques rejetés (copie/clone et service des fichiers).
- Chemins d'upload validés (pas de `..`, pas de chemin absolu).
- Limite de 200 Mo ; dossiers inutiles (`node_modules`, `.git`, `.nuxt`, `.output`, `.cache`, `coverage`) exclus côté client.
- Noms réservés.

**À faire**
1. **Isolation par conteneur Docker** pour les builds (install, build, clone). C'est le point critique : sans lui, le code d'un utilisateur s'exécute avec les droits de la machine.
   Options : `--network` limité, `--read-only`, `--cap-drop ALL`, `--user` non-root, `--memory`, `--cpus`, `--pids-limit`, dossier de build seul monté.
2. Installation avec `npm ci --ignore-scripts` si le projet n'en a pas besoin.
3. En-têtes de sécurité sur les sites servis (`nosniff`, CSP de base, pas de listage de dossiers).
4. Journaux : filtrer les jetons et clés qui pourraient apparaître dans les logs stockés.
5. Passer les clés Clerk de développement aux clés de production.
6. Quotas de taille par projet et par utilisateur.

## 9. Déploiement VPS (plan, non commencé)

- VPS **Ubuntu** avec **Docker** déjà installé. **nginx** déjà en place sur le domaine **fabrich.site**.
- Application : `deplay.fabrich.site` → nginx → Nuxt sur `127.0.0.1:<port>`, lancé par **systemd**.
- Worker : second service systemd, utilisateur dédié, sans root.
- Sites publiés : `<projet>.fabrich.site`. Statique : nginx sert le dossier de sortie (`try_files $uri $uri/ /index.html`).
  Serveur Nitro : nginx fait `proxy_pass` vers le port interne du conteneur, jamais exposé.
- Le worker écrit un fichier nginx par projet, valide avec `nginx -t`, recharge nginx. Ces actions root passent par un petit script autorisé dans `sudoers` pour cette seule commande.
- DNS : enregistrement `*.fabrich.site` vers l'IP du VPS (une seule fois).
- HTTPS : certificat wildcard (certbot, défi DNS) si le fournisseur DNS a une API, sinon un certificat par sous-domaine (défi HTTP), avec la limite Let's Encrypt à surveiller.
- Pare-feu : ouvrir seulement 22 (SSH par clé), 80 et 443.
- Développement local : `SITE_URL_MODE=port|subdomain` (à créer) ; les navigateurs résolvent `*.localhost`.
- Clerk : ajouter `deplay.fabrich.site` aux origines autorisées ; passer aux clés de production.
- Sauvegardes : `prisma/dev.db` et `storage/` (à planifier).

**Informations manquantes (à demander à l'utilisateur)**
1. Fournisseur DNS de `fabrich.site` (OVH, Cloudflare, Gandi…) et accès API éventuel.
2. Configuration nginx actuelle du VPS (`sudo nginx -T`, ou la liste des `server_name`), pour éviter les conflits.

## 10. État fonctionnel

**Fonctionne (vérifié par tests API ou build)**
- Création de projets Git et upload (JSON et multipart), avec premier déploiement en attente.
- Worker : build d'un site statique uploadé, publication sur localhost, échec propre sur un dépôt inconnu,
  reprise après redémarrage, arrêt à la suppression, conservation du port au redéploiement, nettoyage des anciens builds.
- Redirection après création ; terminal des logs à hauteur fixe avec défilement.
- Routes privées refusent les appels non connectés (401).

**Pas testé dans un navigateur** (l'utilisateur fait les tests visuels)
- Tout le parcours d'interface avec session Clerk.
- Propriété entre deux comptes.
- Redéploiement complet avec session.

**Limites connues**
- Les sites publiés dépendent du worker : si le worker s'arrête, les sites s'arrêtent (ils sont repris au redémarrage).
- Le worker ne gère que `nuxt` (serveur Nitro) et le statique ; Next.js n'est pas servi en mode serveur.
- Le dépôt Git doit être public (pas d'identifiants).
- Le CMS (`eptaadmin-prefetch`) est interrogé pendant le build : le contenu d'un site dépend du CMS au moment du build.
- Le redéploiement d'un upload réutilise les fichiers stockés : il ne reprend pas un dossier local modifié.
- Usage du workspace et statistiques : données de démo.
- Les projets existants sans propriétaire sont invisibles jusqu'à `npm run db:claim -- user_xxx`.
- Le `package.json` est propre (le caractère parasite a été retiré).

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
