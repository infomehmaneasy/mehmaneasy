export const DEFAULT_SUPPORT_EMAIL = "info.mehmaneasy@gmail.com";

export function getSupportEmail() {
  return process.env.SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;
}
