/* ═══════════════════════════════════════════════════════════
   DEPLAY — content.js (landing)
   Contenu du template « Site Immersif ». Seule la partie
   window.SITE_CONTENT est propre à Deplay ; l'injection en bas
   de fichier est celle du template, inchangée.
   ═══════════════════════════════════════════════════════════ */

window.SITE_CONTENT = {

  brand: {
    name: 'Deplay',
    title: 'Deplay — Déployer sans DevOps, pour les indépendants',
    description: 'Deplay publie vos sites et vos API depuis GitHub ou un simple dépôt de fichiers, avec une adresse publique en quelques secondes. Aucun serveur à gérer.',
    kicker: 'DEPLAY — HÉBERGEMENT POUR INDÉPENDANTS',
    copyright: '© 2026 — FABRICH.SITE',
    signature: 'DÉPLOYÉE AVEC DEPLAY',
    socials: [
      { label: 'GITHUB ↗', url: 'https://github.com/FabrichJean' },
      { label: 'FABRICH.SITE ↗', url: 'https://fabrich.site' }
    ]
  },

  nav: { proof: 'PLATEFORME', universes: 'MÉTHODE', cta: 'COMMENCER' },

  hook: {
    line1: 'Votre code en ligne,',
    line2a: 'sans toucher',
    line2b: 'un serveur.',
    image: 'images/hero.jpg',
    imageAlt: 'Crêtes de montagnes éclairées de bleu dans la nuit',
    floaters: [
      'images/fl-01.jpg',
      'images/fl-02.jpg',
      'images/fl-03.jpg',
      'images/fl-04.jpg',
      'images/fl-05.jpg',
      'images/fl-06.jpg',
      'images/fl-07.jpg',
      'images/fl-08.jpg',
      'images/fl-09.jpg',
      'images/fl-10.jpg'
    ]
  },

  positioning: 'Vos sites et API en ligne, sans DevOps.',

  manifesto: {
    text: 'Vous livrez des sites et des API à vos clients, pas des fichiers de configuration. Deplay construit, publie et surveille à votre place. Vous gardez la main sur [[votre code]], on s’occupe du serveur.'
  },

  proof: {
    layout: 'bento',
    kicker: 'LA PLATEFORME',
    title: 'Tout ce qu’il faut pour livrer',
    sub: 'Quatre briques, aucune ligne de configuration serveur.',
    meta: 'QUATRE PILIERS — UN SEUL TABLEAU DE BORD',
    projects: [],
    features: [
      { size: 'big',  illu: 'illustrations/fe-1.svg', title: 'Déploiement depuis GitHub', meta: 'DÉPÔT PRIVÉ — BRANCHE — BUILD ISOLÉ' },
      { size: 'tall', illu: 'illustrations/fe-2.svg', title: 'Web services Node et Python', meta: 'PORT PUBLIC — REDÉMARRAGE AUTO' },
      { size: 'tall', illu: 'illustrations/fe-3.svg', title: 'Variables d’environnement', meta: 'IMPORT .ENV — REDÉPLOIEMENT' },
      { size: 'big',  illu: 'illustrations/fe-4.svg', title: 'Logs et usage en direct', meta: 'BUILD — EXÉCUTION — QUOTA 700 MO' }
    ]
  },

  motto: {
    kicker: 'CE QUI GUIDE CHAQUE DÉPLOIEMENT',
    words: [
      { word: 'Simple', hint: 'Un dépôt, un clic, une adresse publique.' },
      { word: 'Rapide', hint: 'Votre site en ligne avant la fin du café.' },
      { word: 'Clair', hint: 'Des quotas lisibles, aucune facture surprise.' }
    ]
  },

  universes: {
    introA: 'Un',
    introB: 'projet,',
    introC: '3 étapes.',
    cta: 'Commencer →',
    image: 'images/process.jpg',
    items: [
      { name: 'Connectez', meta: 'ÉTAPE — 01', desc: 'Importez un dépôt GitHub ou déposez simplement vos fichiers. Deplay détecte le framework et pré-remplit les commandes.' },
      { name: 'Déployez', meta: 'ÉTAPE — 02', desc: 'Le build tourne dans un conteneur isolé. Votre site ou votre API reçoit sa propre adresse publique.' },
      { name: 'Suivez', meta: 'ÉTAPE — 03', desc: 'Logs, trafic et stockage en direct. Un clic relance le déploiement, un service arrêté redémarre seul.' }
    ]
  },

  /* À VALIDER : avis et chiffre inventés, à remplacer par un vrai client avant publication */
  testimonial: {
    kicker: 'FREELANCE — HEURES GAGNÉES PAR SEMAINE',
    figure: '−4',
    unit: 'h',
    quote: 'Avant, chaque mise en ligne me coûtait une soirée de configuration. Maintenant je pousse mon code et j’envoie le lien au client dans la foulée.',
    author: 'NADIA R. — DÉVELOPPEUSE FREELANCE'
  },

  objections: {
    items: ['Pas de serveur à configurer.', 'Pas de pipeline à écrire.', 'Pas de facture surprise.'],
    finale: 'Juste votre code,',
    pill: 'en ligne.'
  },

  contact: {
    kicker: 'UN PROJET À METTRE EN LIGNE ?',
    email: 'contact@fabrich.site',
    reassurance: 'RÉPONSE SOUS 24 H — 700 MO ET 2 WEB SERVICES PAR COMPTE'
  },

  trail: [
    'images/tr-01.jpg', 'images/tr-02.jpg', 'images/tr-03.jpg', 'images/tr-04.jpg',
    'images/tr-05.jpg', 'images/tr-06.jpg', 'images/tr-07.jpg', 'images/tr-08.jpg',
    'images/tr-09.jpg', 'images/tr-10.jpg', 'images/tr-11.jpg', 'images/tr-12.jpg',
    'images/tr-13.jpg', 'images/tr-14.jpg', 'images/tr-15.jpg', 'images/tr-16.jpg',
    'images/tr-17.jpg', 'images/tr-18.jpg', 'images/tr-19.jpg', 'images/tr-20.jpg'
  ]
};

/* ═══════════════════════════════════════════════════════════
   INJECTION — NE PAS MODIFIER (remplit le DOM avant app.js)
   ═══════════════════════════════════════════════════════════ */
(() => {
  const C = window.SITE_CONTENT;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };

  document.title = C.brand.title;
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', C.brand.description);

  // chrome
  set('.loader-wordmark', C.brand.name);
  set('.dock-wordmark', C.brand.name);
  set('.dock-link[href="#travaux"]', C.nav.proof);
  set('.dock-link[href="#explorer"]', C.nav.universes);
  set('.dock-cta', C.nav.cta);

  // 1 · accroche
  set('#heroKicker', C.brand.kicker);
  set('#heroLine1', C.hook.line1);
  const hls = $$('#heroLine2 .hl');
  if (hls.length === 2) { hls[0].textContent = C.hook.line2a; hls[1].textContent = C.hook.line2b; }
  const g1 = $('#grow1 img');
  if (g1) { g1.src = C.hook.image; g1.alt = C.hook.imageAlt; }
  $$('.floaters .fl img').forEach((img, i) => { if (C.hook.floaters[i]) img.src = C.hook.floaters[i]; });

  // 2 · positionnement (un span par mot)
  const intro = $('#spotIntro');
  if (intro) intro.innerHTML = C.positioning.split(' ').map((w) => `<span>${w}</span>`).join(' ');

  // 3 · démarche
  const fill = $('#fillText');
  if (fill) {
    fill.innerHTML = C.manifesto.text.replace(
      /\[\[(.+?)\]\]/,
      '<span class="boxed" id="boxedPhrase">$1<svg class="box-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="boxPath" d="M50,6 C88,4 98,22 97,50 C96,82 76,96 49,95 C16,94 3,76 4,48 C5,18 20,7 50,6 Z"/></svg></span>'
    );
  }

  // 4 · preuve : masonry (8 photos) ou bento (4 features big/tall/tall/big)
  const head = $$('.coll-head > *');
  if (head.length === 4) {
    head[0].textContent = C.proof.kicker;
    head[1].textContent = C.proof.title;
    head[2].textContent = C.proof.sub;
    head[3].textContent = C.proof.meta;
  }
  const grid = $('#collGrid');
  if (grid && C.proof.layout === 'bento') {
    grid.className = 'bento-grid';
    grid.innerHTML = C.proof.features.map((f) =>
      `<figure class="card${f.size ? ' b-' + f.size : ''}"><div class="card-img"><img src="${f.illu}" alt="${f.title}"></div><figcaption>${f.title}<span class="mono">${f.meta}</span></figcaption></figure>`
    ).join('');
  } else if (grid) {
    grid.className = 'coll-grid';
    const SPEEDS = [-0.05, 0.06, -0.028, 0.085];
    grid.innerHTML = SPEEDS.map((s, ci) =>
      `<div class="col" data-pspeed="${s}">` +
      C.proof.projects.slice(ci * 2, ci * 2 + 2).map((p) =>
        `<figure class="card"><div class="card-img"><img src="${p.img}" alt="${p.title} — ${p.meta}"></div><figcaption>${p.title}<span class="mono">${p.meta}</span></figcaption></figure>`
      ).join('') + '</div>'
    ).join('');
  }

  // 5 · devise (train de mots-clés)
  set('#mottoKicker', C.motto.kicker);
  const mtrack = $('#mottoTrack');
  if (mtrack) mtrack.innerHTML = C.motto.words.map((w) => `<span class="mw">${w.word}</span>`).join('');

  // 6-7 · processus immersif (visuels posés un à un)
  set('#nw1', C.universes.introA);
  set('#nw2', C.universes.introB);
  set('#nw3', C.universes.introC);
  const g2 = $('#grow2 img');
  if (g2) g2.src = C.universes.image || (C.universes.items[0] || {}).img || g2.src;
  const psteps = $('#psteps');
  if (psteps) {
    psteps.innerHTML = C.universes.items.map((u) =>
      `<div class="pstep"><span class="pstep-meta mono ash">${u.meta}</span><h3>${u.name}</h3><p>${u.desc || ''}</p></div>`
    ).join('');
  }
  const sCta = $('#stepsCtaLink');
  if (sCta) sCta.childNodes[0].textContent = C.universes.cta;

  // 8 · preuve sociale — le chiffre qui frappe
  set('#figKicker', C.testimonial.kicker || '');
  const figM = String(C.testimonial.figure || '').trim().match(/^([^\d.,+-]*[+\u2212-]?)\s*(-?[\d.,]+)/);
  set('#figPre', figM ? figM[1] : '');
  set('#figVal', figM ? figM[2] : '');
  set('#figUnit', C.testimonial.unit || '');
  set('#quoteText', C.testimonial.quote);
  set('#quoteAuthor', C.testimonial.author);

  // 9 · objections
  C.objections.items.forEach((t, i) => set('#fs' + (i + 1), t));
  const fs4 = $('#fs4');
  if (fs4) {
    fs4.innerHTML = `${C.objections.finale} <span class="pill" id="pillPhrase">${C.objections.pill}<svg class="pill-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="pillPath" d="M50,6 C88,4 98,22 97,50 C96,82 76,96 49,95 C16,94 3,76 4,48 C5,18 20,7 50,6 Z"/></svg></span>`;
  }
  $$('#trail img').forEach((img, i) => { img.src = C.trail[i % C.trail.length]; });

  // 10 · conversion
  set('.footer-kicker', C.contact.kicker);
  const mail = $('.footer-mail');
  if (mail) { mail.href = 'mailto:' + C.contact.email; mail.querySelector('.footer-mail-text').textContent = C.contact.email; }
  set('.footer-reassurance', C.contact.reassurance);
  const fname = $('#footerName');
  if (fname) { fname.textContent = C.brand.name; fname.setAttribute('aria-label', C.brand.name); }
  const bottom = $$('.footer-bottom > p');
  if (bottom.length === 3) {
    bottom[0].textContent = C.brand.copyright;
    bottom[1].innerHTML = C.brand.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`).join('&nbsp;&nbsp;&nbsp;');
    bottom[2].textContent = C.brand.signature;
  }
})();
