// Deplay sous pm2. Lit /opt/deplay/.env (les valeurs restent côté serveur) et lance l'app sous l'utilisateur deplay.
const fs = require('fs')

const env = {}
for (const line of fs.readFileSync('/opt/deplay/.env', 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (match) env[match[1]] = match[2].replace(/^"(.*)"$/, '$1')
}

module.exports = {
  apps: [
    {
      name: 'deplay-app',
      cwd: '/opt/deplay',
      script: '.output/server/index.mjs',
      interpreter: '/opt/node22/bin/node',
      uid: 'deplay',
      gid: 'deplay',
      env: { ...env, NODE_ENV: 'production', PORT: process.env.DEPLAY_PORT || '3100', HOST: '127.0.0.1' },
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,
    },
  ],
}
