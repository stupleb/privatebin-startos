export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting PrivateBin!': 0,
  'store.json is missing': 1,
  'Web Interface': 2,
  'The web interface is ready': 3,
  'The web interface is not ready': 4,

  // interfaces.ts
  'Web UI': 5,
  'Create and read encrypted pastes': 6,

  // init/watchCredentials.ts
  'Set the password for creating pastes': 7,

  // actions/setCreatorPassword.ts
  'Set Creator Password': 8,
  'Generate a new random password for creating pastes. Anyone can open a paste link without it. Replaces any existing password.': 9,
  'Replaces the current creator password.': 10,
  'Creator login': 11,
  'Your browser asks for this login when you open the PrivateBin front page to create a paste. Readers never need it.': 12,
  Username: 13,
  Password: 14,

  // actions/configure.ts
  'Who can create pastes': 15,
  'Anyone with a paste link can read it either way. With a password required, only people who have the creator login can create pastes or post comments.': 16,
  'Creator password required': 17,
  Anyone: 18,
  'Default expiry': 19,
  'The expiry preselected when creating a paste. The creator can still pick another.': 20,
  '5 minutes': 21,
  '10 minutes': 22,
  '1 hour': 23,
  '1 day': 24,
  '1 week': 25,
  '1 month': 26,
  '1 year': 27,
  Never: 28,
  'Size limit': 29,
  'The largest paste or comment PrivateBin accepts, in megabytes, measured after encryption. An attachment counts about a third more than its file size.': 30,
  'File attachments': 31,
  'Let creators attach a file to a paste. While this is off, attachments on existing pastes are hidden too.': 32,
  Discussions: 33,
  'Let creators open a paste for comments. With a creator password required, readers need that login to comment.': 34,
  'Preselect burn after reading': 35,
  'Tick "Burn after reading" by default, so a paste is deleted the first time it is opened.': 36,
  'Paste passwords': 37,
  'Let creators protect a paste with a password of its own, on top of the key in its link.': 38,
  'Rate limit': 39,
  'How long each visitor must wait between creating pastes, in seconds. 0 turns the limit off.': 40,
  seconds: 41,
  'Configure PrivateBin': 42,
  'Choose who can create pastes, and set the expiry, size limit, attachments, discussions and rate limit. Changing who can create pastes restarts PrivateBin; the other settings apply at once.': 43,

  // actions/purgeExpired.ts
  'Purge Expired Pastes': 44,
  'Delete every paste whose expiry has passed and report how many pastes remain. PrivateBin already deletes a few expired pastes whenever a new one is created, and never shows an expired one.': 45,
  'Expired pastes purged': 46,
  'Every expired paste has been deleted.': 47,
  MB: 48,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
