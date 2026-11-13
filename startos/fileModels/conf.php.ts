import { FileHelper, z } from '@start9labs/start-sdk'
import * as INI from 'ini'
import { sdk } from '../sdk'
import { expiryKeys, maxSizeLimitMb } from '../utils'

const main = z.looseObject({
  discussion: z.boolean().catch(false),
  password: z.boolean().catch(true),
  fileupload: z.boolean().catch(false),
  burnafterreadingselected: z.boolean().catch(false),
  sizelimit: z.coerce
    .number()
    .int()
    .min(1)
    .max(maxSizeLimitMb * 1_000_000)
    .catch(maxSizeLimitMb * 1_000_000),
})
const expire = z.looseObject({
  default: z.enum(expiryKeys).catch('1week'),
})
const traffic = z.looseObject({
  limit: z.coerce.number().int().min(0).catch(10),
  header: z.literal('X_FORWARDED_FOR').catch('X_FORWARDED_FOR'),
})
const model = z.looseObject({
  class: z.literal('Filesystem').catch('Filesystem'),
})
const modelOptions = z.looseObject({
  dir: z.literal('/srv/data').catch('/srv/data'),
})

const shape = z.looseObject({
  main: main.catch(() => main.parse({})),
  expire: expire.catch(() => expire.parse({})),
  traffic: traffic.catch(() => traffic.parse({})),
  model: model.catch(() => model.parse({})),
  model_options: modelOptions.catch(() => modelOptions.parse({})),
})

const iniValue = (v: unknown) =>
  typeof v === 'boolean' || typeof v === 'number'
    ? String(v)
    : `"${String(v).replace(/[\\"]/g, '\\$&')}"`

const toIni = (data: Record<string, unknown>) =>
  Object.entries(data)
    .flatMap(([section, keys]) =>
      typeof keys === 'object' && keys !== null
        ? [
            `[${section}]\n` +
              Object.entries(keys)
                .flatMap(([k, v]) =>
                  Array.isArray(v)
                    ? v.map((x) => `${k}[] = ${iniValue(x)}\n`)
                    : [`${k} = ${iniValue(v)}\n`],
                )
                .join(''),
          ]
        : [],
    )
    .join('\n')

export const confPhp = FileHelper.raw(
  { base: sdk.volumes.startos, subpath: 'cfg/conf.php' },
  toIni,
  (raw) => INI.parse(raw),
  (data) => shape.parse(data),
)
