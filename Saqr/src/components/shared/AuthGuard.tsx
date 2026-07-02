import { Navigate } from "react-router-dom";
import { getToken, getUser } from "../../api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const user = getUser();
  if (!token) return <Navigate to="/" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}
