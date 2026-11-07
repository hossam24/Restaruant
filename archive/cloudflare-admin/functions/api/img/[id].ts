import type { Env } from '../../_shared/http'

/** Public: a photo of one of the owner's own items. The address changes when the photo changes, so it can be cached for good. */
export const onRequestGet: PagesFunction<Env, 'id'> = async ({ params, env }) => {
  const id = String(params.id)
  if (!env.MENU_KV || !/^[a-f0-9]{16}$/.test(id)) return new Response('Not found', { status: 404 })

  const { value, metadata } = await env.MENU_KV.getWithMetadata<{ type?: string }>(`img:${id}`, 'arrayBuffer')
  if (!value) return new Response('Not found', { status: 404 })

  return new Response(value, {
    headers: {
      'Content-Type': metadata?.type ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
