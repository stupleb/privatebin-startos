import { confPhp } from '../fileModels/conf.php'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { maxSizeLimitMb } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  creation: Value.select({
    name: i18n('Who can create pastes'),
    description: i18n(
      'Anyone with a paste link can read it either way. With a password required, only people who have the creator login can create pastes or post comments.',
    ),
    default: 'password',
    values: {
      password: i18n('Creator password required'),
      anyone: i18n('Anyone'),
    },
  }),
  defaultExpiry: Value.select({
    name: i18n('Default expiry'),
    description: i18n(
      'The expiry preselected when creating a paste. The creator can still pick another.',
    ),
    default: '1week',
    values: {
      '5min': i18n('5 minutes'),
      '10min': i18n('10 minutes'),
      '1hour': i18n('1 hour'),
      '1day': i18n('1 day'),
      '1week': i18n('1 week'),
      '1month': i18n('1 month'),
      '1year': i18n('1 year'),
      never: i18n('Never'),
    },
  }),
  sizeLimitMb: Value.number({
    name: i18n('Size limit'),
    description: i18n(
      'The largest paste or comment PrivateBin accepts, in megabytes, measured after encryption. An attachment counts about a third more than its file size.',
    ),
    required: true,
    default: maxSizeLimitMb,
    min: 1,
    max: maxSizeLimitMb,
    integer: true,
    units: i18n('MB'),
  }),
  fileUpload: Value.toggle({
    name: i18n('File attachments'),
    description: i18n(
      'Let creators attach a file to a paste. While this is off, attachments on existing pastes are hidden too.',
    ),
    default: false,
  }),
  discussion: Value.toggle({
    name: i18n('Discussions'),
    description: i18n(
      'Let creators open a paste for comments. With a creator password required, readers need that login to comment.',
    ),
    default: false,
  }),
  burnAfterReadingSelected: Value.toggle({
    name: i18n('Preselect burn after reading'),
    description: i18n(
      'Tick "Burn after reading" by default, so a paste is deleted the first time it is opened.',
    ),
    default: false,
  }),
  pastePasswords: Value.toggle({
    name: i18n('Paste passwords'),
    description: i18n(
      'Let creators protect a paste with a password of its own, on top of the key in its link.',
    ),
    default: true,
  }),
  trafficLimitSeconds: Value.number({
    name: i18n('Rate limit'),
    description: i18n(
      'How long each visitor must wait between creating pastes, in seconds. 0 turns the limit off.',
    ),
    required: true,
    default: 10,
    min: 0,
    integer: true,
    units: i18n('seconds'),
  }),
})

export const configure = sdk.Action.withInput(
  // id
  'configure',

  // metadata
  async ({ effects }) => ({
    name: i18n('Configure PrivateBin'),
    description: i18n(
      'Choose who can create pastes, and set the expiry, size limit, attachments, discussions and rate limit. Changing who can create pastes restarts PrivateBin; the other settings apply at once.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // input spec
  inputSpec,

  // pre-fill
  async ({ effects }) => {
    const conf = await confPhp.read().once()
    const openCreation = await storeJson.read((s) => s.openCreation).once()
    return (
      conf && {
        creation: openCreation ? ('anyone' as const) : ('password' as const),
        defaultExpiry: conf.expire.default,
        sizeLimitMb: Math.max(1, Math.round(conf.main.sizelimit / 1_000_000)),
        fileUpload: conf.main.fileupload,
        discussion: conf.main.discussion,
        burnAfterReadingSelected: conf.main.burnafterreadingselected,
        pastePasswords: conf.main.password,
        trafficLimitSeconds: conf.traffic.limit,
      }
    )
  },

  // execution
  async ({ effects, input }) => {
    await confPhp.merge(effects, {
      main: {
        discussion: input.discussion,
        password: input.pastePasswords,
        fileupload: input.fileUpload,
        burnafterreadingselected: input.burnAfterReadingSelected,
        sizelimit: input.sizeLimitMb * 1_000_000,
      },
      expire: { default: input.defaultExpiry },
      traffic: { limit: input.trafficLimitSeconds },
    })
    await storeJson.merge(effects, {
      openCreation: input.creation === 'anyone',
    })
  },
)
