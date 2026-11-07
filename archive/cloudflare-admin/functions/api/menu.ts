import { json, readShop, type Env } from '../_shared/http'

/** Public: everything the owner changed. The site lays it over its built-in menu. */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return json(await readShop(env), 200, { 'Cache-Control': 'public, max-age=30' })
}
