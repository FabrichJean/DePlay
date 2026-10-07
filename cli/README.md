# deplay-cli

Deploy a local website to [Deplay](https://deplay.fabrich.site) from your terminal.

```sh
npx deplay-cli login --token dpl_xxxxxxxx
npx deplay-cli deploy
```

Or install it once: `npm install -g deplay-cli`, then use the `deplay` command.

Requires Node.js 18.17 or later.

## 1. Create a token

In Deplay, open **Settings → CLI tokens**, give the token a name (e.g. your machine) and create it.
Copy it right away: it is only shown once.

```sh
deplay login --token dpl_xxxxxxxx
```

The token is saved in `~/.config/deplay/config.json` (readable only by you).
`deplay whoami` checks it, `deplay logout` forgets it. To revoke it for good, use Settings → CLI tokens.

## 2. Deploy a folder

```sh
deplay deploy            # current folder
deplay deploy ./my-site  # another folder
```

**First deploy:** the CLI detects the framework from `package.json` (Nuxt, Next.js, Vite, otherwise static HTML),
asks for a project name, then creates the project. The folder is then linked to it through `.deplay/project.json`.
This file holds no secret (only the project's id and name): commit it if you deploy from CI.

**Next deploys:** the files are re-uploaded and the site is rebuilt. The build logs are shown live,
followed by the site's address.

Deplay runs the install and build commands on its side: send the sources, not the build output.
For a site that is already built, deploy the output folder as static HTML:

```sh
deplay deploy ./dist --preset static
```

### Options

| Option | Description |
|---|---|
| `--name <name>` | Project name, 3–40 lowercase letters, digits or dashes (first deploy only) |
| `--preset <preset>` | `nuxt`, `next`, `vite` or `static` |
| `--build-command <cmd>` | Replace the build command |
| `--install-command <cmd>` | Replace the install command |
| `--output-dir <dir>` | Replace the output folder |
| `--new` | Ignore `.deplay/` and create a new project |
| `--no-wait` | Don't follow the build |
| `-y`, `--yes` | No questions: use the detected values |
| `--api <url>` | Deplay server URL |

## Excluded files

Never sent: `node_modules`, `.git`, `.deplay`, `.env` and `.env.*` (except `.env.example`), as well as the
framework's build folders (`.nuxt`, `.output`, `.next`, `out`, `dist`).

To exclude more, add a `.deplayignore` file at the root of the folder, using the same syntax as `.gitignore`:

```
drafts/
*.psd
/notes.md
```

Environment variables are managed in the project's page on Deplay, not sent from your `.env` file.

## Limits

200 MB and 5,000 files per upload, within your account's storage quota.
Only websites are supported for now; web services are deployed from the Deplay dashboard.

## CI

```sh
DEPLAY_TOKEN=dpl_xxxxxxxx npx deplay-cli deploy --yes
```

Deploy once from your machine and commit `.deplay/project.json`, so that CI updates the same project.

`DEPLAY_TOKEN` and `DEPLAY_API_URL` take precedence over the saved configuration.
