import { useState, useEffect } from "react";
import { superAdminDashboard, createAdminUser } from "../api";

const inputClass =
  "w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm transition-colors";
const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ email: "", phone_number: "", designation: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    superAdminDashboard().then(setStats).catch(() => {});
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const data = await createAdminUser(form);
      setSuccess(data.success || "Admin created successfully.");
      setForm({ email: "", phone_number: "", designation: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Super Admin Dashboard</h1>
        <p className="text-slate-400 text-sm">Manage admin accounts</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Admins</p>
            <p className="text-2xl font-bold text-white">{stats.total_admins}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Users</p>
            <p className="text-2xl font-bold text-white">{stats.total_users}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Create Admin</h2>

        {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
        {success && <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} type="email" name="email" placeholder="admin@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input className={inputClass} name="phone_number" placeholder="01XXXXXXXXX" value={form.phone_number} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass}>Designation</label>
            <input className={inputClass} name="designation" placeholder="Station Manager" value={form.designation} onChange={handleChange} required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors">
            {loading ? "Creating…" : "Create Admin"}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-4">
          A temporary password will be auto-generated and emailed to this address.
        </p>
      </div>
    </div>
  );
}