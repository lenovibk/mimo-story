import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Sparkle } from "@phosphor-icons/react";
import { api, ApiError } from "@/services/api";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { Button } from "@/components/ui/Button";

export function Login() {
  const navigate = useNavigate();
  const token = useAdminAuthStore((s) => s.token);
  const login = useAdminAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email.trim().toLowerCase(), password);
      login(res.token, res.admin);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError && err.code === "invalid_credentials" ? "Sai email hoặc mật khẩu." : "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Sparkle size={20} weight="fill" />
          </span>
          <h1 className="text-xl font-bold text-slate-800">MimoKids Admin</h1>
        </div>
        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Email</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-400"
          />
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Mật khẩu</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-400"
          />
        </label>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}
