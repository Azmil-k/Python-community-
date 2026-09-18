export const VALID_ROLES = ["STUDENT", "MENTOR", "ADMIN"];
export const VALID_STATUSES = ["PENDING", "COMPLETED", "INCOMPLETE"];

export function isValidRole(value) {
  return typeof value === "string" && VALID_ROLES.includes(value);
}

export function isValidStatus(value) {
  return typeof value === "string" && VALID_STATUSES.includes(value);
}
