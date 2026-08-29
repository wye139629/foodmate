// ponytail: a hardcoded allowlist, not a roles table — there's exactly one
// reviewer for this hackathon build. Move to a real roles system if that
// changes.
const ADMIN_EMAILS = ["wye139629@gmail.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
