export default defineNuxtConfig({
  modules: ['@clerk/nuxt'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  // Nuxt 4 lit app/ par défaut ; on garde la structure à la racine du projet
  srcDir: '.',

  // storage/ contient les fichiers uploadés et les builds du worker (avec leurs node_modules) :
  // les surveiller épuise les descripteurs de fichiers et provoque des « spawn EBADF »
  ignore: ['storage/**', 'worker/**', 'prisma/*.db*'],
  watchers: {
    chokidar: { ignored: ['**/storage/**', '**/prisma/*.db*'] },
  },
  vite: {
    server: {
      watch: { ignored: ['**/storage/**', '**/prisma/*.db*'] },
    },
  },

  // Chaque fichier de components/ est exposé sous son nom seul (ex: AppIcon),
  // sans préfixe de dossier.
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  // Côté serveur uniquement. Surchargé par NUXT_PROJECTS_STORAGE_DIR (voir .env)
  runtimeConfig: {
    projectsStorageDir: './storage/projects',
  },

  app: {
    head: {
      title: 'Deplay',
      htmlAttrs: { lang: 'en' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Caveat:wght@500&display=swap',
        },
      ],
    },
  },
})
