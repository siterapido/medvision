const DEFAULT_STORAGE_HOST = "storage.bunnycdn.com"

type BunnyConfig = {
  storageZone: string
  apiKey: string
  host: string
  cdnBaseUrl: string
}

function ensureConfig(): BunnyConfig {
  const storageZone = process.env.BUNNY_STORAGE_ZONE
  const apiKey = process.env.BUNNY_STORAGE_API_KEY
  const host = process.env.BUNNY_STORAGE_HOST || DEFAULT_STORAGE_HOST
  const cdnBaseUrl = process.env.BUNNY_CDN_BASE_URL

  if (!storageZone || !apiKey || !cdnBaseUrl) {
    throw new Error("Configuração do Bunny Storage ausente. Defina BUNNY_STORAGE_ZONE, BUNNY_STORAGE_API_KEY e BUNNY_CDN_BASE_URL.")
  }

  return {
    storageZone,
    apiKey,
    host,
    cdnBaseUrl: cdnBaseUrl.replace(/\/+$/, ""),
  }
}

function normalizePath(path: string): string {
  return path.replace(/^\/+/, "")
}

function buildStorageUrl(path: string, cfg: BunnyConfig): string {
  const cleanPath = normalizePath(path)
  return `https://${cfg.host}/${cfg.storageZone}/${cleanPath}`
}

export function buildBunnyPublicUrl(path: string): string {
  const cfg = ensureConfig()
  const cleanPath = normalizePath(path)
  const base = cfg.cdnBaseUrl.endsWith("/") ? cfg.cdnBaseUrl : `${cfg.cdnBaseUrl}/`
  return `${base}${cleanPath}`
}

type UploadOptions = {
  contentType?: string
  cacheControl?: string
}

async function toUint8Array(payload: File | Blob | ArrayBuffer | Buffer | Uint8Array): Promise<Uint8Array> {
  if (payload instanceof Uint8Array) return payload
  if (payload instanceof ArrayBuffer) return new Uint8Array(payload)
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(payload)) return new Uint8Array(payload)
  return new Uint8Array(await payload.arrayBuffer())
}

export async function uploadToBunnyStorage(
  path: string,
  payload: File | Blob | ArrayBuffer | Buffer | Uint8Array,
  options: UploadOptions = {},
): Promise<{ path: string; publicUrl: string }> {
  const cfg = ensureConfig()
  const body = await toUint8Array(payload)
  const storageUrl = buildStorageUrl(path, cfg)

  const res = await fetch(storageUrl, {
    method: "PUT",
    body: body as unknown as BodyInit,
    headers: {
      AccessKey: cfg.apiKey,
      "Content-Type": options.contentType || "application/octet-stream",
      "Content-Length": body.byteLength.toString(),
      ...(options.cacheControl ? { "Cache-Control": options.cacheControl } : {}),
    },
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText)
    throw new Error(`Falha ao enviar para o Bunny (${res.status}): ${errorText}`)
  }

  return {
    path: normalizePath(path),
    publicUrl: buildBunnyPublicUrl(path),
  }
}

export async function deleteFromBunnyStorage(path: string): Promise<void> {
  const cfg = ensureConfig()
  const storageUrl = buildStorageUrl(path, cfg)
  const res = await fetch(storageUrl, {
    method: "DELETE",
    headers: {
      AccessKey: cfg.apiKey,
    },
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText)
    throw new Error(`Falha ao remover do Bunny (${res.status}): ${errorText}`)
  }
}
