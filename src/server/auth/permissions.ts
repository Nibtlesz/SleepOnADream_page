/** Control de acceso por rol. Se verifica en el servidor en cada página y cada acción. */
export type AdminRole = "ADMIN" | "STORE_MANAGER" | "EDITOR";

export const PERMISSIONS = {
  dashboard: ["ADMIN", "STORE_MANAGER", "EDITOR"],
  stats: ["ADMIN", "STORE_MANAGER"],
  products: ["ADMIN", "STORE_MANAGER"],
  orders: ["ADMIN", "STORE_MANAGER"],
  content: ["ADMIN", "EDITOR"],
  audit: ["ADMIN"],
} as const satisfies Record<string, readonly AdminRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  ADMIN: "Administrador",
  STORE_MANAGER: "Tienda",
  EDITOR: "Contenido",
};
