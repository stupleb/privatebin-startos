import { chown } from 'node:fs/promises'
import { confPhp } from '../fileModels/conf.php'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { appGid, appUid } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects) => {
  await storeJson.merge(effects, {})
  await confPhp.merge(effects, {})
  await chown(sdk.volumes.data.path, appUid, appGid)
})
