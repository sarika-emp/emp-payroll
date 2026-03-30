// Auth helpers — store/retrieve tokens and user info
// User identity comes from EmpCloud master database.

export interface AuthUser {
  id: number; // EmpCloud user ID
  empcloudUserId: number; // EmpCloud user ID
  empcloudOrgId: number; // EmpCloud organization ID
  orgId: number; // alias for empcloudOrgId (used by dashboard/audit pages)
  payrollProfileId: string | null; // Payroll DB profile UUID
  role: string;
  email: string;
  firstName: string;
  lastName: string;
  empCode: string;
  designation: string;
  department: string;
  orgName: string;
}

export function saveAuth(data: { user: any; tokens: any }) {
  localStorage.setItem("access_token", data.tokens.accessToken);
  localStorage.setItem("refresh_token", data.tokens.refreshToken);
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: data.user.id || data.user.empcloudUserId,
      empcloudUserId: data.user.empcloudUserId || data.user.id,
      empcloudOrgId: data.user.empcloudOrgId || data.user.orgId,
      orgId: data.user.empcloudOrgId || data.user.orgId,
      payrollProfileId: data.user.payrollProfileId || null,
      role: data.user.role,
      email: data.user.email,
      firstName: data.user.firstName || data.user.first_name,
      lastName: data.user.lastName || data.user.last_name,
      empCode: data.user.empCode || data.user.emp_code || "",
      designation: data.user.designation || "",
      department: data.user.department || "",
      orgName: data.user.orgName || "",
    }),
  );
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

/**
 * Extract the SSO token from the URL query string (if present).
 * Returns the raw token string, or null if not found.
 * The token will be exchanged server-side for Payroll-specific JWTs.
 */
export function extractSSOToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  const ssoToken = params.get("sso_token");
  if (!ssoToken) return null;

  // Mark that this session came from EMP Cloud SSO
  localStorage.setItem("sso_source", "empcloud");
  const returnUrl = params.get("return_url") || "https://test-empcloud.empcloud.com/dashboard";
  localStorage.setItem("empcloud_return_url", returnUrl);

  // Clean the URL immediately so the token doesn't linger
  const url = new URL(window.location.href);
  url.searchParams.delete("sso_token");
  url.searchParams.delete("return_url");
  window.history.replaceState({}, "", url.pathname + url.hash);

  return ssoToken;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("token"); // old mock token
  window.location.href = "/login";
}
