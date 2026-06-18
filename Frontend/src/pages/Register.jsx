import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sendRegistrationOtp, verifyRegistrationOtp, createAccount } from "../api";

// ── Step indicators ───────────────────────────────────────────────
function Steps({ current }) {
  const steps = ["Fill Details", "Verify Email", "Done"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${done ? "bg-green-500 text-white" :
                    active ? "bg-indigo-600 text-white" :
                    "bg-slate-800 text-slate-500"}`}
              >
                {done ? "✓" : idx}
              </div>
              <span className={`text-xs whitespace-nowrap ${active ? "text-slate-200" : "text-slate-500"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 h-px mb-4 ${done ? "bg-green-500" : "bg-slate-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Reusable input classes ────────────────────────────────────────
const inputCls =
  "w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm transition-colors";
const labelCls =
  "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

// ── Step 1 — Fill registration form ──────────────────────────────
function StepForm({ onNext }) {
  const [form, setForm] = useState({
    full_name: "", email: "", nid: "",
    phone_number: "", password: "", confirm_password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await sendRegistrationOtp({ email: form.email });
      onNext(form); // pass form data to next step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Create Your Account</h2>
        <p className="text-slate-400 text-sm">Fill in your details to get started</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Full Name</label>
          <input className={inputCls} name="full_name" placeholder="Md. Rahim Uddin"
            value={form.full_name} onChange={handleChange} required />
        </div>

        <div>
          <label className={labelCls}>Email</label>
          <input className={inputCls} name="email" type="email" placeholder="rahim@example.com"
            value={form.email} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>NID Number</label>
            <input className={inputCls} name="nid" placeholder="1234567890"
              value={form.nid} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} name="phone_number" placeholder="01XXXXXXXXX"
              value={form.phone_number} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <label className={labelCls}>Password</label>
          <input className={inputCls} name="password" type="password"
            placeholder="Min 8 chars, A-z, 0-9, special"
            value={form.password} onChange={handleChange} required />
        </div>

        <div>
          <label className={labelCls}>Confirm Password</label>
          <input className={inputCls} name="confirm_password" type="password"
            placeholder="Repeat password"
            value={form.confirm_password} onChange={handleChange} required />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors mt-1">
          {loading ? "Sending OTP…" : "Send OTP to Email"}
        </button>
      </form>
    </>
  );
}

// ── Step 2 — Verify OTP ───────────────────────────────────────────
function StepOtp({ formData, onSuccess }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      // 1. Verify OTP
      await verifyRegistrationOtp({ email: formData.email, otp_code: otp });
      setSuccess("OTP verified! Creating your account…");

      // 2. Create account
      setCreating(true);
      await createAccount(formData);
      onSuccess(); // go to step 3
    } catch (err) {
      setError(err.message);
      setSuccess("");
    } finally {
      setLoading(false);
      setCreating(false);
    }
  };

  const handleResend = async () => {
    setError(""); setSuccess("");
    setResending(true);
    try {
      await sendRegistrationOtp({ email: formData.email });
      setSuccess("New OTP sent — check your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Verify Your Email</h2>
        <p className="text-slate-400 text-sm">
          A 6-digit code was sent to{" "}
          <span className="text-indigo-400 font-medium">{formData.email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className={labelCls}>Enter OTP</label>
          <input
            className={`${inputCls} text-center text-3xl tracking-[0.6em] font-bold py-4`}
            placeholder="······"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            maxLength={6}
            inputMode="numeric"
            required
          />
          <p className="text-xs text-slate-500 mt-1.5 text-center">
            Code expires in 5 minutes
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {creating ? "Creating Account…" : loading ? "Verifying…" : "Verify & Create Account"}
        </button>
      </form>

      <button
        onClick={handleResend}
        disabled={resending}
        className="w-full mt-3 text-sm text-slate-400 hover:text-white transition-colors py-2 disabled:opacity-50"
      >
        {resending ? "Sending…" : "Didn't receive it? Resend OTP"}
      </button>
    </>
  );
}

// ── Step 3 — Success ──────────────────────────────────────────────
function StepSuccess() {
  const navigate = useNavigate();
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">✅</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
      <p className="text-slate-400 text-sm mb-8">
        Your account has been verified and created successfully.
      </p>
      <button
        onClick={() => navigate("/login", { state: { info: "Account created! Please log in." } })}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        Go to Sign In
      </button>
    </div>
  );
}

// ── Main Register page ────────────────────────────────────────────
export default function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">

        {/* Logo */}
        <div className="text-center mb-2">
          <span className="text-4xl">🪑</span>
        </div>

        <Steps current={step} />

        {step === 1 && (
          <StepForm
            onNext={(data) => { setFormData(data); setStep(2); }}
          />
        )}
        {step === 2 && (
          <StepOtp
            formData={formData}
            onSuccess={() => setStep(3)}
          />
        )}
        {step === 3 && <StepSuccess />}

        {step !== 3 && (
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}