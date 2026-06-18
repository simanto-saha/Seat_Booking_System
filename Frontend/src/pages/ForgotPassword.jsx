import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { generateOtp, verifyOtp } from "../api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const data = await generateOtp({ email });
      setSuccess(data.message);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const data = await verifyOtp({ email, otp_code: otp });
      setSuccess(data.message);
      setTimeout(() => navigate("/login", { state: { info: "OTP verified. Please log in." } }), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(""); setSuccess("");
    setLoading(true);
    try {
      await generateOtp({ email });
      setSuccess("New OTP sent — check your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🔑</span>
          <h1 className="text-2xl font-bold text-white mb-1">
            {step === 1 ? "Verify via OTP" : "Enter OTP"}
          </h1>
          <p className="text-slate-400 text-sm">
            {step === 1
              ? "We'll send a 6-digit code to your email"
              : `Code sent to ${email}`}
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

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className={labelClass}>Registered Email</label>
              <input className={inputClass} type="email" placeholder="your@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className={labelClass}>6-digit OTP</label>
              <input className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`}
                placeholder="••••••" value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6} inputMode="numeric" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? "Verifying…" : "Verify OTP"}
            </button>
            <button type="button" onClick={handleResend} disabled={loading}
              className="w-full text-sm text-slate-400 hover:text-white transition-colors py-1">
              Resend OTP
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}