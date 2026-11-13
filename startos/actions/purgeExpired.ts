import { i18n } from '../i18n'
import { mounts } from '../main'
import { sdk } from '../sdk'

export const purgeExpired = sdk.Action.withoutInput(
  // id
  'purge-expired',

  // metadata
  async ({ effects }) => ({
    name: i18n('Purge Expired Pastes'),
    description: i18n(
      'Delete every paste whose expiry has passed and report how many pastes remain. PrivateBin already deletes a few expired pastes whenever a new one is created, and never shows an expired one.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // execution
  async ({ effects }) => {
    const statistics = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'privatebin' },
      mounts,
      'purge-expired',
      async (sub) => {
        await sub.execFail(['administration', '--purge'])
        await sub.execFail(['administration', '--empty-dirs'])
        return (await sub.execFail(['administration', '--statistics'])).stdout
      },
    )
    return {
      version: '1',
      title: i18n('Expired pastes purged'),
      message: i18n('Every expired paste has been deleted.'),
      result: {
        type: 'single',
        value: String(statistics).trim(),
        masked: false,
        copyable: true,
        qr: false,
        launchable: false,
      },
    }
  },
)
