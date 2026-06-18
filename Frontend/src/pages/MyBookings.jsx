import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { myBookings, cancelBooking } from "../api";
import { useAuth } from "../context/AuthContext";

const statusStyle = {
  confirmed: "bg-green-500/15 text-green-400 border border-green-500/30",
  pending:   "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  cancelled: "bg-red-500/15 text-red-400 border border-red-500/30",
};

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (!user || user.role === "guest") { navigate("/login"); return; }
    myBookings()
      .then(setBookings)
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    setCancelling(id);
    try {
      await cancelBooking(id);
      setBookings((prev) =>
        prev.map((b) => b.booking_id === id ? { ...b, status: "cancelled" } : b)
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">My Bookings</h1>
        <p className="text-slate-400 text-sm">All your past and upcoming seat reservations</p>
      </div>

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading bookings…</div>
      ) : bookings.length === 0 ? (
        <div className="py-20 text-center">
          <span className="text-5xl block mb-4">🎫</span>
          <p className="text-slate-400 mb-6">No bookings yet.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Book a Seat
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.booking_id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

              {/* Top row */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusStyle[b.status] || ""}`}>
                    {b.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">#{b.invoice_number}</span>
                </div>
                <span className="text-lg font-bold text-white">৳{b.amount}</span>
              </div>

              {/* Details */}
              <div className="px-5 py-4 space-y-3">
                <div className="flex gap-4 items-baseline">
                  <span className="text-xs text-slate-500 uppercase tracking-wider w-24 shrink-0">Seats</span>
                  <div className="flex flex-wrap gap-1.5">
                    {b.seats.map((s) => (
                      <span key={s} className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-2.5 py-1 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="text-xs text-slate-500 uppercase tracking-wider w-24 shrink-0">Travel Date</span>
                  <span className="text-sm text-slate-200">{b.arrival_date}</span>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="text-xs text-slate-500 uppercase tracking-wider w-24 shrink-0">Ticket Code</span>
                  <span className="text-sm text-slate-200 font-mono tracking-wide">{b.ticket_checker}</span>
                </div>
              </div>

              {/* Cancel button */}
              {b.status !== "cancelled" && (
                <div className="px-5 py-3 border-t border-slate-800">
                  <button
                    onClick={() => handleCancel(b.booking_id)}
                    disabled={cancelling === b.booking_id}
                    className="text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelling === b.booking_id ? "Cancelling…" : "Cancel Booking"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}