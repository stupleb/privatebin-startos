import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { creatorUsername } from '../utils'

export const setCreatorPassword = sdk.Action.withoutInput(
  // id
  'set-creator-password',

  // metadata
  async ({ effects }) => ({
    name: i18n('Set Creator Password'),
    description: i18n(
      'Generate a new random password for creating pastes. Anyone can open a paste link without it. Replaces any existing password.',
    ),
    warning: (await storeJson.read((s) => s.creatorPassword).const(effects))
      ? i18n('Replaces the current creator password.')
      : null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // execution
  async ({ effects }) => {
    const password = utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 })
    await storeJson.merge(effects, { creatorPassword: password })
    return {
      version: '1',
      title: i18n('Creator login'),
      message: i18n(
        'Your browser asks for this login when you open the PrivateBin front page to create a paste. Readers never need it.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: creatorUsername,
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
