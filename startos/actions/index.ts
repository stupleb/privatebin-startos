import { sdk } from '../sdk'
import { configure } from './configure'
import { purgeExpired } from './purgeExpired'
import { setCreatorPassword } from './setCreatorPassword'

export const actions = sdk.Actions.of()
  .addAction(setCreatorPassword)
  .addAction(configure)
  .addAction(purgeExpired)
