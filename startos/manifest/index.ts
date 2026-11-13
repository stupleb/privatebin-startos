import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'privatebin',
  title: 'PrivateBin',
  license: 'Zlib',
  packageRepo: 'https://github.com/stupleb/privatebin-startos',
  upstreamRepo: 'https://github.com/PrivateBin/PrivateBin',
  marketingUrl: 'https://privatebin.info',
  donationUrl: null,
  description: { short, long },
  volumes: ['startos', 'data'],
  images: {
    privatebin: {
      source: { dockerTag: 'ghcr.io/privatebin/fs:2.1.1' },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
