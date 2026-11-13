import { createHash, randomBytes } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import type { Store } from './fileModels/store.json'
import { sdk } from './sdk'

export const uiPort = 8080
export const appUid = 65534
export const appGid = 82

export const creatorUsername = 'admin'
export const authRealm = 'PrivateBin'

export const expiryKeys = [
  '5min',
  '10min',
  '1hour',
  '1day',
  '1week',
  '1month',
  '1year',
  'never',
] as const

export const maxSizeLimitMb = 10

const serverDir = `${sdk.volumes.startos.path}/nginx/server.d`
const locationDir = `${sdk.volumes.startos.path}/nginx/location.d`

const ssha = (password: string) => {
  const salt = randomBytes(8)
  const digest = createHash('sha1').update(password).update(salt).digest()
  return `{SSHA}${Buffer.concat([digest, salt]).toString('base64')}`
}

export async function writeCreationGate(store: Store) {
  await rm(serverDir, { recursive: true, force: true })
  await rm(locationDir, { recursive: true, force: true })
  await mkdir(serverDir, { recursive: true })
  await mkdir(locationDir, { recursive: true })
  if (store.openCreation) return

  await writeFile(
    `${serverDir}/creation-gate.conf`,
    [
      'set $privatebin_auth off;',
      `if ($request_method !~ ^(GET|HEAD)$) { set $privatebin_auth "${authRealm}"; }`,
      `if ($request_uri ~ ^/(index\\.php)?\\??$) { set $privatebin_auth "${authRealm}"; }`,
      '',
    ].join('\n'),
  )
  await writeFile(
    `${locationDir}/creation-gate.conf`,
    [
      'auth_basic $privatebin_auth;',
      'auth_basic_user_file /etc/nginx/location.d/htpasswd;',
      '',
    ].join('\n'),
  )
  await writeFile(
    `${locationDir}/htpasswd`,
    store.creatorPassword
      ? `${creatorUsername}:${ssha(store.creatorPassword)}\n`
      : '',
  )
}
