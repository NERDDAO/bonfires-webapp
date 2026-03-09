/**
 * Resolve which bonfire a Clerk org maps to (via ClerkOrgMapping backend).
 * Returns bonfire_id, is_admin, and subdomain slug.
 * Caching is handled server-side by the Next.js API route (Cache-Control).
 */
export interface OrgBonfireMapping {
  bonfire_id: string | null;
  is_admin: boolean;
  slug: string | null;
}

export async function resolveOrgBonfireMapping(
  orgId: string
): Promise<OrgBonfireMapping | null> {
  try {
    const res = await fetch(
      `/api/orgs/${encodeURIComponent(orgId)}/bonfire-mapping`,
      { method: "GET" }
    );
    if (!res.ok) return null;
    return (await res.json()) as OrgBonfireMapping;
  } catch {
    return null;
  }
}
