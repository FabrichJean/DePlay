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
    description: 'Server-rendered or static Nuxt app',
    installCommand: 'npm install',
    buildCommand: 'npm run build',
    outputDirectory: '.output/public',
  },
  {
    value: 'next',
    label: 'Next.js',
    description: 'React framework with App Router',
    installCommand: 'npm install',
    buildCommand: 'npm run build',
    outputDirectory: '.next',
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
