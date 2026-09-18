import { getUser } from "@/app/actions";

/**
 * Helper to enforce authentication and optional role authorization for API routes.
 * Returns a Response object (401 or 403) if auth fails, or the user object if auth succeeds.
 * 
 * @param {string[]} [allowedRoles] Optional array of roles permitted to access the endpoint.
 * @returns {Promise<import("@prisma/client").User | Response>} User object or Error Response
 */
export async function requireApiUser(allowedRoles) {
  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return user;
}
