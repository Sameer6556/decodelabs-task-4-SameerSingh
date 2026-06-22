/* Validation for an opportunity payload (same rules as Project 3).
   validateOpportunity(body)            → full (POST/PUT)
   validateOpportunity(body,{partial})  → only present fields (PATCH) */
export const CAUSES = ["Environment", "Education", "Health", "Community", "Animal Welfare"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateOpportunity(body, { partial = false } = {}) {
  const errors = [];
  const d = body ?? {};
  const has = (k) => d[k] !== undefined;

  if (!partial || has("title")) {
    if (typeof d.title !== "string" || d.title.trim().length < 3)
      errors.push("title is required (at least 3 characters).");
  }
  if (!partial || has("organization")) {
    if (typeof d.organization !== "string" || d.organization.trim().length < 2)
      errors.push("organization is required (at least 2 characters).");
  }
  if (!partial || has("cause")) {
    if (!CAUSES.includes(d.cause))
      errors.push(`cause is required and must be one of: ${CAUSES.join(", ")}.`);
  }
  if (!partial || has("location")) {
    if (typeof d.location !== "string" || d.location.trim().length < 2)
      errors.push("location is required (at least 2 characters).");
  }
  if (!partial || has("date")) {
    if (typeof d.date !== "string" || !DATE_RE.test(d.date) || isNaN(new Date(d.date)))
      errors.push("date is required in YYYY-MM-DD format.");
  }
  if (!partial || has("slots")) {
    const n = Number(d.slots);
    if (!Number.isInteger(n) || n < 1 || n > 1000)
      errors.push("slots is required and must be a whole number between 1 and 1000.");
  }

  if (partial && !["title", "organization", "cause", "location", "date", "slots"].some(has))
    errors.push("Provide at least one field to update.");

  return errors;
}
