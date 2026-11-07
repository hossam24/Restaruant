import { json, readShop, type Env } from '../_shared/http'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return json(await readShop(env), 200, { 'Cache-Control': 'public, max-age=30' })
}
