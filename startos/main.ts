import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiPort, writeCreationGate } from './utils'

export const mounts = sdk.Mounts.of()
  .mountVolume({
    volumeId: 'data',
    subpath: null,
    mountpoint: '/srv/data',
    readonly: false,
  })
  .mountVolume({
    volumeId: 'startos',
    subpath: 'cfg',
    mountpoint: '/srv/cfg',
    readonly: true,
  })

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting PrivateBin!'))

  const store = await storeJson.read().const(effects)
  if (!store) throw new Error(i18n('store.json is missing'))

  await writeCreationGate(store)

  return sdk.Daemons.of(effects).addDaemon('primary', {
    subcontainer: sdk.SubContainer.of(
      effects,
      { imageId: 'privatebin' },
      mounts
        .mountVolume({
          volumeId: 'startos',
          subpath: 'nginx/server.d',
          mountpoint: '/etc/nginx/server.d',
          readonly: true,
        })
        .mountVolume({
          volumeId: 'startos',
          subpath: 'nginx/location.d',
          mountpoint: '/etc/nginx/location.d',
          readonly: true,
        }),
      'privatebin-sub',
    ),
    exec: { command: sdk.useEntrypoint(), runAsInit: true },
    ready: {
      display: i18n('Web Interface'),
      fn: () =>
        sdk.healthCheck.checkWebUrl(
          effects,
          `http://localhost:${uiPort}/?jsonld=paste`,
          {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          },
        ),
    },
    requires: [],
  })
})
