import { setCreatorPassword } from '../actions/setCreatorPassword'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const watchCredentials = sdk.setupOnInit(async (effects) => {
  const store = await storeJson.read().const(effects)

  if (store && !store.openCreation && !store.creatorPassword) {
    await sdk.action.createOwnTask(effects, setCreatorPassword, 'critical', {
      reason: i18n('Set the password for creating pastes'),
    })
  } else {
    await sdk.action.clearTask(effects, 'privatebin:set-creator-password')
  }
})
