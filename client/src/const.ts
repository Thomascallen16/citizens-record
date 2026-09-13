export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// First-party authentication. Kept as a tiny compatibility shim because older
// screens still call startLogin(); no external OAuth configuration is required.
export const startLogin = () => {
  window.location.href = "/login";
};
