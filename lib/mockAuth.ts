export const AUTH_KEY = "athlink-user";

export function saveMockUser(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify({ email }));
}

export function getMockUser(): { email: string } | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearMockUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
}