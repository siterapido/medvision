export type UserRole = "admin" | "cliente" | "vendedor"

export const DEFAULT_ROLE: UserRole = "cliente"

type RoleLike = string | null | undefined

type RoleMetadataSource = {
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
} | null | undefined

function normalizeRole(role?: RoleLike): UserRole | undefined {
  if (role === "admin") return "admin"
  if (role === "cliente") return "cliente"
  if (role === "vendedor") return "vendedor"
  return undefined
}

function roleFromMetadata(metadata?: Record<string, unknown>): UserRole | undefined {
  if (!metadata) return undefined
  const roleValue = typeof metadata.role === "string" ? metadata.role : undefined
  return normalizeRole(roleValue)
}

export function isAdmin(role?: RoleLike): role is "admin" {
  return normalizeRole(role) === "admin"
}

export function isVendedor(role?: RoleLike): role is "vendedor" {
  return normalizeRole(role) === "vendedor"
}

export function resolveUserRole(profileRole?: RoleLike, metadataSource?: RoleMetadataSource): UserRole {
  return (
    normalizeRole(profileRole) ??
    roleFromMetadata(metadataSource?.app_metadata) ??
    roleFromMetadata(metadataSource?.user_metadata) ??
    DEFAULT_ROLE
  )
}
