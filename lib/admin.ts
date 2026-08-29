// ponytail: a hardcoded allowlist, not a roles table — a handful of
// reviewers for this hackathon build. Move to a real roles system if that
// changes.
const ADMIN_EMAILS = [
  "wye139629@gmail.com",
  "yliu0568@uni.sydney.edu.au",
  "xcha0878@uni.sydney.edu.au",
  "mkim0554@uni.sydney.edu.au",
  "yhua0320@uni.sydney.edu.au",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
