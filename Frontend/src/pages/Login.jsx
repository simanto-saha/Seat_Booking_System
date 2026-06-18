import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { loginApi } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const info = location.state?.info || "";

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginApi(form);
      setUser(data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🪑</span>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome Back</h1>
          <p className="text-slate-400 text-sm">Sign in to manage your bookings</p>
        </div>

        {info && (
          <div className="mb-4 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm px-4 py-3 rounded-lg">
            {info}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>NID or Email</label>
            <input className={inputClass} name="identifier"
              placeholder="NID number or email address"
              value={form.identifier} onChange={handleChange} required />
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input className={inputClass} name="password" type="password"
              placeholder="Your password"
              value={form.password} onChange={handleChange} required />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-600">or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <button
          onClick={() => navigate("/forgot-password")}
          className="w-full border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-sm py-2.5 rounded-lg transition-colors"
        >
          Forgot password? Use OTP
        </button>

        <p className="text-center text-sm text-slate-500 mt-6">
          New here?{" "}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300">Create account</Link>
        </p>
      </div>
    </div>
  );
}