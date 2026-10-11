# Deplay

Deplay is a small hosting platform. You give it a GitHub repository or a folder of files, it builds the project in an isolated container and publishes the result at `https://<name>.fabrich.site`. It also runs long-lived web services (Node.js or Python) behind their own address.

It is built and run by one person, for personal use and a few independent developers. It is not a Vercel replacement.

## What it does

- **Websites:** static sites and framework projects (Nuxt, Next.js, Vite, plain HTML), from a private GitHub repository or an uploaded folder or zip.
- **Web services:** a Node.js or Python process listening on a port, with its own public address and a restart on failure.
- **Builds:** each build runs in its own Docker container with fixed CPU, memory and process limits.
- **Environment variables:** stored per project, injected at build and at runtime.
- **Logs and usage:** build logs, runtime logs, storage and traffic, per account.
- **Command line:** `deplay-cli` deploys a local folder from a terminal (see [cli/](cli/README.md)).

Limits (storage, services per account, build and service resources) live in [config/limits.json](config/limits.json) and are listed on the public site.

## How it fits together

```
Browser / CLI ──► Nuxt app (pages, API)  ──► SQLite (Prisma)
                         │
                         └─ storage/projects/<name>   uploaded files

Worker (separate process) ──► reads queued deployments from the database
   ├─ prepares the code (copy or git clone)
   ├─ runs install and build in a Docker container
   └─ publishes: static files for nginx, or a service container on a local port
```

The app and the worker only talk to each other through the database.

| Part | Choice |
|---|---|
| App | Nuxt 4, Vue 3, Nitro |
| Authentication | Clerk (sessions for the dashboard, personal tokens for the CLI) |
| Database | SQLite through Prisma 6 |
| Worker | Node script in [worker/](worker/), outside Nuxt |
| Isolation | Docker, one container per build |
| Public site | static HTML in [public/landing-hero-concept/](public/landing-hero-concept/), English and French |

## Domains

| Address | What it serves |
|---|---|
| `deplay.fabrich.site` | public site (landing, runtimes, docs), static files through nginx |
| `ondeplay.fabrich.site` | the platform: sign-in, dashboard, API |
| `<name>.fabrich.site` | a published project |

## Run it locally

You need Node.js 22. Docker is only needed to run builds with isolation.

```sh
npm install
cp deploy/env.example .env      # then edit it (see below)
npm run db:migrate
npm run dev                     # http://localhost:3000
```

The example file uses the server's paths (`/opt/deplay/...`). Locally, set `DATABASE_URL="file:./dev.db"`, `NUXT_PROJECTS_STORAGE_DIR="./storage/projects"`, your Clerk development keys, and delete the other lines you do not need.

In development the app also serves the public site, so `http://localhost:3000` shows the landing page when you are signed out.

To build projects, start the worker in another terminal. Locally you can skip containers with `BUILD_ISOLATION=none`; never do that on a server.

```sh
npm run worker
```

Other commands: `npm run build`, `npm run db:seed`, `npm run db:claim -- <clerk_user_id>`.

## Repository layout

```
pages/ components/ layouts/   dashboard (Nuxt)
server/api/                   HTTP routes
server/middleware/            landing (dev only), CLI token authentication
server/utils/                 database, storage, limits, mappers
worker/                       build and publish worker
prisma/                       schema and migrations
config/                       limits, runtimes, reserved names
public/landing-hero-concept/  public site
cli/                          deplay-cli (npm package, published separately)
deploy/                       nginx, systemd, pm2, update script, VPS notes
```

[CONTEXT.md](CONTEXT.md) goes into more detail (in French): routes, worker behaviour, design decisions and security status.

## Deploy

Production runs on a single Ubuntu VPS: nginx in front, the app under pm2, the worker under systemd, builds in Docker. Everything needed is in [deploy/](deploy/), and [deploy/README.md](deploy/README.md) describes the installation. Updating is one script:

```sh
sudo /opt/deplay/deploy/update.sh
```

It pulls `origin/main`, installs dependencies, builds, applies migrations, copies the public site and restarts the app and the worker. It stops if the server's copy of the repository has local changes.

## Security notes

- Builds run in unprivileged containers with a read-only filesystem, only the build folder mounted, and limits on memory, CPU and processes.
- A project always belongs to one account; another account sees a 404.
- CLI tokens are stored as SHA-256 hashes, shown once, and can be revoked in Settings.
- Sites are published on subdomains of the same registrable domain as the platform. Keep that in mind before opening sign-ups widely: scripts on a published site run next to the platform's cookies.

## License

No license has been chosen yet. Until one is added, all rights are reserved.
