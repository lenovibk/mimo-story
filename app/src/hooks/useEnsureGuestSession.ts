import { useEffect, useRef } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Silently creates a "guest" parent (no email) the first time the app is used,
 * so a child/favorites/progress owner always exists without ever asking for
 * login. Safe to call from multiple pages - only fires the request once.
 */
export function useEnsureGuestSession() {
  const token = useAuthStore((s) => s.token);
  const login = useAuthStore((s) => s.login);
  const requested = useRef(false);

  useEffect(() => {
    if (token || requested.current) return;
    requested.current = true;
    api
      .guestLogin()
      .then((res) => login(res.token, res.parent, res.children))
      .catch(() => {
        requested.current = false;
      });
  }, [token, login]);

  return token;
}
