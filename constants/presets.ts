import type { FrameworkPreset } from '~/types/website'

export interface PresetOption {
  value: FrameworkPreset
  label: string
  description: string
  installCommand: string
  buildCommand: string
  outputDirectory: string
}

export const PRESETS: PresetOption[] = [
  {
    value: 'nuxt',
    label: 'Nuxt',
    description: 'Static site generated with nuxt generate',
    installCommand: 'npm install',
    buildCommand: 'npx nuxt generate',
    outputDirectory: '.output/public',
  },
  {
    value: 'next',
    label: 'Next.js',
    description: "Static export (set output: 'export' in next.config)",
    installCommand: 'npm install',
    buildCommand: 'npm run build',
    outputDirectory: 'out',
  },
  {
    value: 'vite',
    label: 'Vite',
    description: 'Client-side app bundled with Vite',
    installCommand: 'npm install',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
  },
  {
    value: 'static',
    label: 'Static HTML',
    description: 'Plain files, no build step',
    installCommand: '',
    buildCommand: '',
    outputDirectory: '.',
  },
]
