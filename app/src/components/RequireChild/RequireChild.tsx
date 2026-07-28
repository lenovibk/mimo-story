import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useEnsureGuestSession } from "@/hooks/useEnsureGuestSession";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Route guard for pages that need a child selected. No email/login is required
 * to use the app: the first visit silently creates a "guest" parent (no email)
 * so children/favorites/progress still have an owner - email is only asked for
 * later, when upgrading to a paid plan (see Dashboard's subscription section).
 * Auto-picks the child when there's exactly one, so a single-child family never
 * sees the picker.
 */
export function RequireChild() {
  const token = useEnsureGuestSession();
  const children = useAuthStore((s) => s.children);
  const activeChildId = useAuthStore((s) => s.activeChildId);
  const setActiveChild = useAuthStore((s) => s.setActiveChild);

  useEffect(() => {
    if (token && children.length === 1 && !activeChildId) {
      setActiveChild(children[0].id);
    }
  }, [token, children, activeChildId, setActiveChild]);

  if (!token) return null;
  if (children.length === 0) return <Navigate to="/onboarding" replace />;
  if (!activeChildId) {
    if (children.length > 1) return <Navigate to="/select-child" replace />;
    return null;
  }

  return <Outlet />;
}
