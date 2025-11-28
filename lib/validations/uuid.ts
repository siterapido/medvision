import { z } from "zod"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const uuidSchema = z.string().regex(UUID_REGEX, { message: "ID inválido" })

export const uuidSchemaWithMessage = (message: string) =>
  z.string().regex(UUID_REGEX, { message })

export const isUuid = (value?: string | null) =>
  uuidSchema.safeParse((value ?? "").trim()).success
