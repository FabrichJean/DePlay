<template>
  <!-- Illustration décorative : SVG inline, aucune requête réseau -->
  <svg viewBox="0 0 200 220" aria-hidden="true">
    <defs>
      <linearGradient id="rocket-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#93c5fd" />
        <stop offset="1" stop-color="#2563eb" />
      </linearGradient>
      <radialGradient id="rocket-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#3b82f6" stop-opacity="0.55" />
        <stop offset="1" stop-color="#3b82f6" stop-opacity="0" />
      </radialGradient>
    </defs>

    <circle cx="110" cy="130" r="80" fill="url(#rocket-glow)" />

    <g fill="#1e3a8a" opacity="0.9">
      <ellipse cx="60" cy="190" rx="46" ry="20" />
      <ellipse cx="110" cy="182" rx="50" ry="24" />
      <ellipse cx="160" cy="192" rx="40" ry="18" />
    </g>
    <g fill="#1e40af">
      <ellipse cx="90" cy="178" rx="34" ry="14" />
      <ellipse cx="138" cy="176" rx="32" ry="13" />
    </g>

    <g transform="translate(108 96) rotate(40)">
      <path d="M0 -62 C 22 -40 24 -6 22 26 L -22 26 C -24 -6 -22 -40 0 -62 Z" fill="url(#rocket-body)" />
      <circle cx="0" cy="-8" r="10" fill="#0b1e3f" />
      <circle cx="0" cy="-8" r="6" fill="#93c5fd" />
      <path d="M-22 4 L-42 26 L-22 26 Z" fill="#2563eb" />
      <path d="M22 4 L42 26 L22 26 Z" fill="#2563eb" />
      <path d="M-12 26 Q 0 58 12 26 Z" fill="#fbbf24" />
      <path d="M-6 26 Q 0 44 6 26 Z" fill="#fff7c2" />
    </g>
  </svg>
</template>
