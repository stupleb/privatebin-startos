import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.1.1:0',
  releaseNotes: {
    en_US: 'Initial release of PrivateBin 2.1.1 for StartOS.',
    es_ES: 'Lanzamiento inicial de PrivateBin 2.1.1 para StartOS.',
    de_DE: 'Erstveröffentlichung von PrivateBin 2.1.1 für StartOS.',
    pl_PL: 'Pierwsze wydanie PrivateBin 2.1.1 dla StartOS.',
    fr_FR: 'Version initiale de PrivateBin 2.1.1 pour StartOS.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
