/* Deplay — FR/EN switch for the public site (index, runtimes, docs).
   Default language: English. The choice is remembered per browser (localStorage).
   Elements marked [data-i18n="key"] get their innerHTML replaced on switch;
   the raw HTML already holds the English text, so there is no flash on first load. */
window.DEPLAY_I18N = {
  en: {
    'meta.title': 'Deplay — Ship without DevOps',
    'meta.desc': 'Deplay publishes your sites and APIs from GitHub, with a public address in seconds. No server to manage.',
    'nav.crumb': '/ platform',
    'nav.runtimes': 'Runtimes',
    'nav.docs': 'Docs',
    'nav.cta': 'Start for free →',

    'hero.card1.quote': '“Simple, fast, and no hassle. Exactly what I needed.”',
    'hero.card2.quote': '“Deplay let me put my API online in minutes. Fast, simple and reliable.”',
    'hero.card3.quote': '“Finally a platform that actually does what it promises.”',

    'hero.kicker': 'Hosting for independents',
    'hero.lede': 'Deplay publishes your sites and APIs, with a public address in seconds. No server to manage.',
    'hero.start.label': 'Deploy from your terminal',
    'hero.cli.hint': 'Deploy a local folder from your terminal.',
    'hero.cli.link': 'CLI docs →',
    'cli.label': 'Command line',
    'cli.title': 'Deploy straight from your terminal.',
    'cli.lede': 'Create a token in Settings, log in once, then ship any local folder with a single command. Builds are streamed live and your address is printed at the end.',
    'cli.p1': 'Detects Nuxt, Next.js, Vite or plain HTML',
    'cli.p2': 'Never sends node_modules, .git or .env files',
    'cli.p3': 'Works in CI with a DEPLAY_TOKEN variable',
    'cli.docs': 'Read the CLI guide →',
    'cli.t.login': '✔ Logged in',
    'cli.t.pack': '› Packing 12 files',
    'cli.t.up': '› Uploading',
    'cli.t.build': '› Following the build…',
    'cli.t.live': '✔ Live at https://&lt;name&gt;.fabrich.site',
    'docs.nav.cli': 'Command line',
    'docs.cli.title': 'Command line (CLI)',
    'docs.cli.lede': 'Deploy a local folder without opening the dashboard. Requires Node.js 18.17 or later. Only websites are supported for now.',
    'docs.cli.s1.title': 'Create a token',
    'docs.cli.s1.desc': 'In Settings → CLI tokens, name the token and create it. Copy it right away: it is shown only once.',
    'docs.cli.s2.title': 'Log in',
    'docs.cli.s3.title': 'Deploy a folder',
    'docs.cli.first': 'On the first deploy the CLI detects the framework, asks for a project name and links the folder through <code>.deplay/project.json</code>. Next runs re-upload the files and rebuild the same project.',
    'docs.cli.cmds': 'Useful commands: <code>deplay whoami</code>, <code>deplay logout</code>, <code>deplay deploy ./dist --preset static</code> (already-built site), <code>--name</code>, <code>--yes</code>, <code>--no-wait</code>, <code>--new</code>. Install once with <code>npm install -g deplay-cli</code> to use the short <code>deplay</code> command.',
    'docs.cli.ignore': 'Never sent: <code>node_modules</code>, <code>.git</code>, <code>.env</code> files and build folders. Add more exclusions in a <code>.deplayignore</code> file (same syntax as <code>.gitignore</code>). Environment variables are set in the project page, not read from your <code>.env</code>. Limits: 200 MB and 5,000 files per upload.',
    'docs.cli.ci': 'In CI, set <code>DEPLAY_TOKEN</code> and run <code>npx deplay-cli deploy --yes</code>; commit <code>.deplay/project.json</code> so that CI updates the same project.',

    'features.label': 'What Deplay handles for you',
    'features.code.title': 'Source code',
    'features.code.desc': 'Private GitHub repositories, branches and commit history. A build triggers on the branch you choose.',
    'features.upload.title': 'Uploaded files',
    'features.upload.desc': 'No Git repository needed: a folder or a zip archive, uploaded directly and published in seconds.',
    'features.env.title': 'Environment variables',
    'features.env.desc': 'Encrypted per project, injected at build and at runtime. Import from a .env file or paste them directly.',
    'features.logs.title': 'Logs and usage',
    'features.logs.desc': 'Build logs, live runtime output, traffic and storage — all visible from the dashboard.',

    'limits.label': 'Account limits',
    'limits.label2': 'Real data, not promises.',
    'limits.title': 'Your plan,<br><span>at a glance.</span>',
    'limits.lede': 'Everything you need to deploy, build and run your projects — with clear, published limits.',
    'limits.storage.title': 'Storage',
    'limits.storage.sub': 'shared between sites and web services',
    'limits.services.title': 'Web services',
    'limits.services.sub': 'per account',
    'limits.memory.title': 'Memory / service',
    'limits.memory.sub': 'dedicated per container',
    'limits.cpu.sub': 'per container',
    'limits.builds.title': 'Concurrent builds',
    'limits.builds.sub': 'across the whole server',
    'limits.builds.account': 'Per account',
    'limits.runtimes.title': 'Supported runtimes',
    'limits.runtimes.more': 'Exact images and commands',
    'limits.runtimes.moresub': 'The install and start commands actually used by the worker.',
    'limits.active': 'active',
    'limits.soon': 'soon',
    'limits.docker.sub': 'your own Dockerfile',

    'cta.kicker': 'Your next deployment',
    'cta.title': "Connect a <em>repository.</em><br>We'll handle the rest.",
    'cta.lede': 'Ready in seconds. No server to configure — just your code.',
    'cta.button': 'Deploy a project',

    'footer.doc': 'Documentation',

    'rt.meta.title': 'Runtimes — Deplay',
    'rt.sub': 'Pre-configured <b>runtimes for your web services</b>',
    'rt.lede': 'A Deplay web service runs in one of these runtimes. The image, install command and start command shown here are the ones actually used by the worker.',
    'rt.side.note': "Every value on this page is read from the worker's configuration.",
    'rt.kicker': 'Active runtime',
    'rt.preview': 'Deployment preview',
    'rt.preview.listen': 'listening on $PORT',
    'rt.preview.live': 'live at &lt;name&gt;.fabrich.site',
    'rt.quick': 'Quick commands',
    'rt.hint.install': 'Install dependencies',
    'rt.hint.start': 'Start command (editable per project)',
    'rt.infra': 'Infrastructure',
    'rt.python.desc': 'For APIs, data processing and audio/video work.',
    'rt.installrun': 'Install &amp; run',
    'rt.details': 'Runtime details',
    'rt.env.hint': 'Set automatically in the container.',
    'rt.node.title': 'Node.js',
    'rt.node.bullet1': 'For an Express, Fastify, Hono API, or any Node server listening on the <code>PORT</code> variable.',
    'rt.node.bullet2': 'The repository folder is mounted as-is in the container, nothing is copied beforehand.',
    'rt.node.bullet3': 'Restarts automatically if the process stops.',
    'rt.node.meta.image': 'Image',
    'rt.node.meta.install': 'Install',
    'rt.node.meta.start': 'Start',
    'rt.node.meta.memory': 'Memory',
    'rt.node.meta.cpu': 'CPU',
    'rt.python.title': 'Python',
    'rt.python.bullet1': 'For a FastAPI, Flask API, or any ASGI/WSGI server listening on the <code>PORT</code> variable.',
    'rt.python.bullet2': '<code>ffmpeg</code> is installed in the image, for audio and video processing.',
    'rt.python.bullet3': 'Packages install into <code>/work/.pylocal</code> (<code>PYTHONUSERBASE</code>), specific to each project.',
    'rt.python.meta.env': 'Environment variables',
    'rt.docker.title': 'Docker',
    'rt.docker.pill': 'coming soon',
    'rt.docker.desc': 'Deploy a project from its own Dockerfile, for stacks beyond Node.js and Python. Not available yet.',
    'rt.docker.meta.status': 'Status',
    'rt.docker.meta.soon': 'In development',
    'footer.home': 'Home',
    'docs.meta.title': 'Documentation — Deplay',

    'docs.title': 'Documentation',
    'docs.lede': 'How Deplay builds, publishes and monitors your sites and APIs.',
    'docs.nav.overview': 'Overview',
    'docs.nav.deploy': 'Deployment',
    'docs.nav.services': 'Web services',
    'docs.nav.env': "Environment variables",
    'docs.nav.faq': 'FAQ',
    'docs.deploy.title': 'Deployment',
    'docs.deploy.lede': 'A deployment always goes through the same three steps, whether it is a static site or a web service.',
    'docs.step1.title': 'Connect',
    'docs.step1.desc': 'Import a GitHub repository, or upload your files directly. Deplay detects the framework and pre-fills the commands.',
    'docs.step2.title': 'Deploy',
    'docs.step2.desc': 'The build runs in an isolated container, separate from your account and other projects.',
    'docs.step3.title': 'Monitor',
    'docs.step3.desc': 'Build logs, runtime logs and storage usage are visible live from the dashboard.',
    'docs.services.title': 'Web services',
    'docs.services.lede': 'A web service is a long-running process listening on a port, with its own public address (<code>&lt;name&gt;.fabrich.site</code>). Two runtimes are available: see <a href="/runtimes">Runtimes</a>. A stopped service restarts on its own; limit of 2 services per account, 1 GB of memory each.',
    'docs.env.title': "Environment variables",
    'docs.env.lede': "Each project has its own variables, encrypted and injected at build and at service startup. Import them from a <code>.env</code> file, paste them directly, or add them one by one. Changing them triggers a new deployment.",
    'docs.faq.title': 'FAQ',
    'docs.faq.item1': '<strong style="color:var(--text)">Does my private repository work?</strong><br>Yes, Deplay connects to your GitHub account and clones the repository during the build.',
    'docs.faq.item2': '<strong style="color:var(--text)">What happens when I delete a project?</strong><br>The web service’s container is stopped and its public route removed within a minute.',
    'docs.faq.item3': '<strong style="color:var(--text)">Is storage shared?</strong><br>Yes: 700 MB in total per account, across all sites and web services combined.',
  },
  fr: {
    'meta.title': 'Deplay — Déployer sans DevOps',
    'meta.desc': 'Deplay publie vos sites et vos API depuis GitHub, avec une adresse publique en quelques secondes. Aucun serveur à gérer.',
    'nav.crumb': '/ plateforme',
    'nav.runtimes': 'Runtimes',
    'nav.docs': 'Docs',
    'nav.cta': 'Commencer gratuitement →',

    'hero.card1.quote': '“Simple, rapide et sans prise de tête. Exactement ce qu’il me fallait.”',
    'hero.card2.quote': '“Deplay m’a permis de mettre mon API en ligne en quelques minutes. C’est rapide, simple et fiable.”',
    'hero.card3.quote': '“Enfin une plateforme qui fait vraiment ce qu’elle promet.”',

    'hero.kicker': 'Hébergement pour indépendants',
    'hero.lede': 'Deplay publie vos sites et vos API, avec une adresse publique en quelques secondes. Aucun serveur à gérer.',
    'hero.start.label': 'Déployer depuis votre terminal',
    'hero.cli.hint': 'Déployez un dossier local depuis votre terminal.',
    'hero.cli.link': 'Doc de la CLI →',
    'cli.label': 'Ligne de commande',
    'cli.title': 'Déployez directement depuis votre terminal.',
    'cli.lede': 'Créez un jeton dans les paramètres, connectez-vous une fois, puis publiez n’importe quel dossier local en une commande. Le build s’affiche en direct et votre adresse est donnée à la fin.',
    'cli.p1': 'Détecte Nuxt, Next.js, Vite ou le HTML simple',
    'cli.p2': 'N’envoie jamais node_modules, .git ni les fichiers .env',
    'cli.p3': 'Fonctionne en CI avec une variable DEPLAY_TOKEN',
    'cli.docs': 'Lire le guide de la CLI →',
    'cli.t.login': '✔ Connecté',
    'cli.t.pack': '› Préparation de 12 fichiers',
    'cli.t.up': '› Envoi',
    'cli.t.build': '› Suivi du build…',
    'cli.t.live': '✔ En ligne sur https://&lt;nom&gt;.fabrich.site',
    'docs.nav.cli': 'Ligne de commande',
    'docs.cli.title': 'Ligne de commande (CLI)',
    'docs.cli.lede': 'Déployez un dossier local sans ouvrir le tableau de bord. Nécessite Node.js 18.17 ou plus. Seuls les sites sont gérés pour l’instant.',
    'docs.cli.s1.title': 'Créer un jeton',
    'docs.cli.s1.desc': 'Dans Paramètres → CLI tokens, nommez le jeton et créez-le. Copiez-le tout de suite : il n’est affiché qu’une fois.',
    'docs.cli.s2.title': 'Se connecter',
    'docs.cli.s3.title': 'Déployer un dossier',
    'docs.cli.first': 'Au premier déploiement, la CLI détecte le framework, demande un nom de projet et lie le dossier via <code>.deplay/project.json</code>. Les envois suivants renvoient les fichiers et reconstruisent le même projet.',
    'docs.cli.cmds': 'Commandes utiles : <code>deplay whoami</code>, <code>deplay logout</code>, <code>deplay deploy ./dist --preset static</code> (site déjà construit), <code>--name</code>, <code>--yes</code>, <code>--no-wait</code>, <code>--new</code>. Installez-la une fois avec <code>npm install -g deplay-cli</code> pour utiliser la commande courte <code>deplay</code>.',
    'docs.cli.ignore': 'Jamais envoyés : <code>node_modules</code>, <code>.git</code>, les fichiers <code>.env</code> et les dossiers de build. Ajoutez des exclusions dans un fichier <code>.deplayignore</code> (même syntaxe que <code>.gitignore</code>). Les variables d’environnement se règlent dans la page du projet, pas depuis votre <code>.env</code>. Limites : 200 Mo et 5 000 fichiers par envoi.',
    'docs.cli.ci': 'En CI, définissez <code>DEPLAY_TOKEN</code> et lancez <code>npx deplay-cli deploy --yes</code> ; versionnez <code>.deplay/project.json</code> pour que la CI mette à jour le même projet.',

    'features.label': 'Ce que Deplay gère pour vous',
    'features.code.title': 'Code source',
    'features.code.desc': 'Dépôts GitHub privés, branches et historique de commits. Un build se déclenche sur la branche que vous choisissez.',
    'features.upload.title': 'Fichiers déposés',
    'features.upload.desc': 'Sans dépôt Git : un dossier ou une archive zip déposée directement, publiée en quelques secondes.',
    'features.env.title': "Variables d'environnement",
    'features.env.desc': "Chiffrées par projet, injectées au build et à l'exécution. S'importent depuis un fichier .env ou se collent directement.",
    'features.logs.title': 'Logs et usage',
    'features.logs.desc': 'Journaux de build, exécution en direct, trafic et stockage — tout reste visible depuis le tableau de bord.',

    'limits.label': 'Limites du compte',
    'limits.label2': 'Données réelles, pas des promesses.',
    'limits.title': 'Votre offre,<br><span>en un coup d’œil.</span>',
    'limits.lede': 'Tout ce qu’il faut pour déployer, builder et faire tourner vos projets — avec des limites claires et publiées.',
    'limits.storage.title': 'Stockage',
    'limits.storage.sub': 'partagé entre sites et web services',
    'limits.services.title': 'Web services',
    'limits.services.sub': 'par compte',
    'limits.memory.title': 'Mémoire / service',
    'limits.memory.sub': 'dédiée par conteneur',
    'limits.cpu.sub': 'par conteneur',
    'limits.builds.title': 'Builds simultanés',
    'limits.builds.sub': 'sur l’ensemble du serveur',
    'limits.builds.account': 'Par compte',
    'limits.runtimes.title': 'Runtimes disponibles',
    'limits.runtimes.more': 'Images et commandes exactes',
    'limits.runtimes.moresub': 'Les commandes d’installation et de démarrage réellement utilisées par le worker.',
    'limits.active': 'actif',
    'limits.soon': 'bientôt',
    'limits.docker.sub': 'votre propre Dockerfile',

    'cta.kicker': 'Votre prochain déploiement',
    'cta.title': 'Connectez un <em>dépôt.</em><br>On s’occupe du reste.',
    'cta.lede': 'Prêt en quelques secondes. Aucun serveur à configurer — juste votre code.',
    'cta.button': 'Déployer un projet',

    'footer.doc': 'Documentation',

    'rt.meta.title': 'Runtimes — Deplay',
    'rt.sub': 'Runtimes <b>préconfigurés pour vos web services</b>',
    'rt.lede': "Un web service Deplay tourne dans l'un de ces runtimes. L'image, la commande d'installation et la commande de démarrage affichées ici sont celles réellement utilisées par le worker.",
    'rt.side.note': 'Chaque valeur de cette page provient de la configuration du worker.',
    'rt.kicker': 'Runtime actif',
    'rt.preview': 'Aperçu du déploiement',
    'rt.preview.listen': 'écoute sur $PORT',
    'rt.preview.live': 'en ligne sur &lt;nom&gt;.fabrich.site',
    'rt.quick': 'Commandes rapides',
    'rt.hint.install': 'Installe les dépendances',
    'rt.hint.start': 'Commande de démarrage (modifiable par projet)',
    'rt.infra': 'Infrastructure',
    'rt.python.desc': 'Pour les API, le traitement de données et l’audio/vidéo.',
    'rt.installrun': 'Installation &amp; lancement',
    'rt.details': 'Détails du runtime',
    'rt.env.hint': 'Définies automatiquement dans le conteneur.',
    'rt.node.title': 'Node.js',
    'rt.node.bullet1': 'Pour une API Express, Fastify, Hono, ou tout serveur Node qui écoute sur la variable <code>PORT</code>.',
    'rt.node.bullet2': 'Le dossier du dépôt est monté tel quel dans le conteneur, rien n’est copié au préalable.',
    'rt.node.bullet3': "Redémarre automatiquement si le processus s'arrête.",
    'rt.node.meta.image': 'Image',
    'rt.node.meta.install': 'Installation',
    'rt.node.meta.start': 'Démarrage',
    'rt.node.meta.memory': 'Mémoire',
    'rt.node.meta.cpu': 'CPU',
    'rt.python.title': 'Python',
    'rt.python.bullet1': 'Pour une API FastAPI, Flask ou tout serveur ASGI/WSGI qui écoute sur la variable <code>PORT</code>.',
    'rt.python.bullet2': '<code>ffmpeg</code> est installé dans l’image, pour les traitements audio et vidéo.',
    'rt.python.bullet3': "Les paquets s'installent dans <code>/work/.pylocal</code> (<code>PYTHONUSERBASE</code>), propre à chaque projet.",
    'rt.python.meta.env': "Variables d'environnement",
    'rt.docker.title': 'Docker',
    'rt.docker.pill': 'bientôt disponible',
    'rt.docker.desc': 'Déployez un projet à partir de son propre Dockerfile, pour les stacks au-delà de Node.js et Python. Pas encore disponible.',
    'rt.docker.meta.status': 'Statut',
    'rt.docker.meta.soon': 'En développement',
    'footer.home': 'Accueil',
    'docs.meta.title': 'Documentation — Deplay',

    'docs.title': 'Documentation',
    'docs.lede': 'Comment Deplay construit, publie et surveille vos sites et vos API.',
    'docs.nav.overview': "Vue d'ensemble",
    'docs.nav.deploy': 'Déploiement',
    'docs.nav.services': 'Web services',
    'docs.nav.env': "Variables d'environnement",
    'docs.nav.faq': 'FAQ',
    'docs.deploy.title': 'Déploiement',
    'docs.deploy.lede': 'Un déploiement passe toujours par les trois mêmes étapes, que ce soit un site statique ou un web service.',
    'docs.step1.title': 'Connectez',
    'docs.step1.desc': 'Importez un dépôt GitHub, ou déposez vos fichiers directement. Deplay détecte le framework et pré-remplit les commandes.',
    'docs.step2.title': 'Déployez',
    'docs.step2.desc': 'Le build tourne dans un conteneur isolé, séparé de votre compte et des autres projets.',
    'docs.step3.title': 'Suivez',
    'docs.step3.desc': "Logs de build, logs d'exécution et usage de stockage sont visibles en direct depuis le tableau de bord.",
    'docs.services.title': 'Web services',
    'docs.services.lede': "Un web service est un processus de longue durée, écoutant sur un port, avec sa propre adresse publique (<code>&lt;nom&gt;.fabrich.site</code>). Deux runtimes sont disponibles : voir <a href=\"/runtimes\">Runtimes</a>. Un service arrêté redémarre seul ; limite de 2 services par compte, 1 Go de mémoire chacun.",
    'docs.env.title': "Variables d'environnement",
    'docs.env.lede': "Chaque projet a ses propres variables, chiffrées et injectées au démarrage du build et du service. Elles s'importent depuis un fichier <code>.env</code>, se collent directement, ou s'ajoutent une par une. Les modifier déclenche un nouveau déploiement.",
    'docs.faq.title': 'FAQ',
    'docs.faq.item1': '<strong style="color:var(--text)">Mon dépôt privé fonctionne-t-il ?</strong><br>Oui, Deplay se connecte à votre compte GitHub et clone le dépôt lors du build.',
    'docs.faq.item2': '<strong style="color:var(--text)">Que se passe-t-il si je supprime un projet ?</strong><br>Le conteneur du web service est arrêté et sa route publique retirée dans la minute.',
    'docs.faq.item3': '<strong style="color:var(--text)">Le stockage est-il partagé ?</strong><br>Oui : 700 Mo au total par compte, pour tous les sites et web services réunis.',
  },
}
;(function () {
  var KEY = 'deplay-lang'
  var FLAGS = { en: '🇬🇧', fr: '🇫🇷' }

  function getLang() {
    try { return localStorage.getItem(KEY) || 'en' } catch (e) { return 'en' }
  }
  function apply(lang) {
    var dict = window.DEPLAY_I18N[lang] || window.DEPLAY_I18N.en
    document.documentElement.lang = lang
    var title = dict[document.body.getAttribute('data-title-key') || 'meta.title']
    if (title) document.title = title
    var desc = document.querySelector('meta[name="description"]')
    if (desc && dict['meta.desc']) desc.setAttribute('content', dict['meta.desc'])
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n')
      if (dict[key] != null) el.innerHTML = dict[key]
    })
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.lang === lang)
    })
    var flag = document.getElementById('langFlag')
    if (flag) flag.textContent = FLAGS[lang] || FLAGS.en
  }
  function setLang(lang) {
    try { localStorage.setItem(KEY, lang) } catch (e) {}
    apply(lang)
  }
  function closeMenu() {
    var s = document.getElementById('langSwitch')
    if (!s) return
    s.classList.remove('open')
    var t = document.getElementById('langToggle')
    if (t) t.setAttribute('aria-expanded', 'false')
  }

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest && e.target.closest('#langToggle')
    var option = e.target.closest && e.target.closest('.lang-btn')
    var switchEl = document.getElementById('langSwitch')

    if (toggle) {
      var open = switchEl.classList.toggle('open')
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
      return
    }
    if (option) {
      setLang(option.dataset.lang)
      closeMenu()
      return
    }
    // clic ailleurs sur la page : referme le menu s'il est ouvert
    if (!switchEl || !switchEl.contains(e.target)) closeMenu()
  })
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu()
  })

  apply(getLang())
})()
