import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiMultiOrigin = await sdk.MultiHost.of(effects, 'ui-multi').bindPort(
    uiPort,
    { protocol: 'http' },
  )

  const ui = sdk.createInterface(effects, {
    name: i18n('Web UI'),
    id: 'ui',
    description: i18n('Create and read encrypted pastes'),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await uiMultiOrigin.export([ui])]
})
