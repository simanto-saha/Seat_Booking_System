import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createSeat, adminChangePassword } from "../api";

const inputClass =
  "w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm transition-colors";
const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

function CreateSeatForm() {
  const [form, setForm] = useState({
    date: "", train_number: "", train_name: "",
    arrival_time: "", departure_time: "", distination: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const data = await createSeat(form);
      setSuccess(data.success);
      setForm({ date: "", train_number: "", train_name: "", arrival_time: "", departure_time: "", distination: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Create Seats for a Train</h2>

      {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Date</label>
            <input className={`${inputClass} [color-scheme:dark]`} type="date" name="date" value={form.date} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass}>Train Number</label>
            <input className={inputClass} name="train_number" placeholder="705" value={form.train_number} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <label className={labelClass}>Train Name</label>
          <input className={inputClass} name="train_name" placeholder="Subarna Express" value={form.train_name} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Arrival Time</label>
            <input className={`${inputClass} [color-scheme:dark]`} type="time" name="arrival_time" value={form.arrival_time} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass}>Departure Time</label>
            <input className={`${inputClass} [color-scheme:dark]`} type="time" name="departure_time" value={form.departure_time} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <label className={labelClass}>Destination</label>
          <input className={inputClass} name="distination" placeholder="Chittagong" value={form.distination} onChange={handleChange} required />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors">
          {loading ? "Creating 1020 seats…" : "Create Seats"}
        </button>
      </form>
    </div>
  );
}

function ChangePasswordForm({ onChanged }) {
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_new_password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const data = await adminChangePassword(form);
      setSuccess(data.success || "Password changed successfully.");
      setForm({ old_password: "", new_password: "", confirm_new_password: "" });
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>

      {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Current Password</label>
          <input className={inputClass} type="password" name="old_password" value={form.old_password} onChange={handleChange} required />
        </div>
        <div>
          <label className={labelClass}>New Password</label>
          <input className={inputClass} type="password" name="new_password" value={form.new_password} onChange={handleChange} required />
        </div>
        <div>
          <label className={labelClass}>Confirm New Password</label>
          <input className={inputClass} type="password" name="confirm_new_password" value={form.confirm_new_password} onChange={handleChange} required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors">
          {loading ? "Updating…" : "Change Password"}
        </button>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, setUser } = useAuth();
  const forced = !!user?.must_change_password;
  const [tab, setTab] = useState(forced ? "password" : "seats");

  const handlePasswordChanged = () => {
    setUser((prev) => ({ ...prev, must_change_password: false }));
    setTab("seats");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm">Manage seats and your account</p>
      </div>

      {forced && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm px-4 py-3 rounded-lg">
          You must change your temporary password before continuing.
        </div>
      )}

      {!forced && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("seats")}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${tab === "seats" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            Create Seats
          </button>
          <button
            onClick={() => setTab("password")}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${tab === "password" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            Change Password
          </button>
        </div>
      )}

      {tab === "seats" && !forced ? <CreateSeatForm /> : <ChangePasswordForm onChanged={handlePasswordChanged} />}
    </div>
  );
}