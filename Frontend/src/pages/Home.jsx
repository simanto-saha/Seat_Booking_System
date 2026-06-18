import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getSeats, bookSeats } from "../api";
import { useAuth } from "../context/AuthContext";

const PRICE = 150;

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSeats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSeats(date);
      setSeats(data);
      setSelected([]);
    } catch {
      setError("Failed to load seats.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchSeats();
    const ws = new WebSocket("ws://localhost:8000/ws/seats/");
    ws.onmessage = fetchSeats;
    return () => ws.close();
  }, [fetchSeats]);

  const toggle = (seat) => {
    if (!seat.is_available) return;
    setSelected((prev) =>
      prev.includes(seat.id) ? prev.filter((id) => id !== seat.id) : [...prev, seat.id]
    );
  };

  const handleBook = async () => {
    if (!user || user.role === "guest") { navigate("/login"); return; }
    if (!selected.length) return;
    setBooking(true); setError(""); setSuccess("");
    try {
      const data = await bookSeats({ seat_ids: selected, arrival_date: date, amount: selected.length * PRICE });
      setSuccess(`✅ Booking confirmed! Invoice: ${data.invoice_number} — Seats: ${data.seats.join(", ")}`);
      fetchSeats();
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  // Group seats by row letter
  const rows = seats.reduce((acc, seat) => {
    const row = seat.seat_number[0];
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  const getSeatClass = (seat) => {
    const base = "w-11 h-11 rounded-lg text-xs font-bold border transition-all duration-150 flex items-center justify-center";
    if (!seat.is_available)
      return `${base} bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed`;
    if (selected.includes(seat.id))
      return `${base} bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20`;
    return `${base} bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-400 cursor-pointer`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Select Your Seats</h1>
          <p className="text-slate-400 text-sm">Choose a date and pick available seats</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Travel Date</label>
          <input
            type="date" value={date} min={today}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none text-white rounded-lg px-3 py-2 text-sm cursor-pointer [color-scheme:dark]"
          />
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Seat card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        {/* Legend */}
        <div className="flex flex-wrap gap-5 mb-6">
          {[
            { label: "Available", cls: "bg-slate-800 border border-slate-700" },
            { label: "Selected",  cls: "bg-indigo-600" },
            { label: "Booked",    cls: "bg-slate-800 border border-slate-700 opacity-40" },
          ].map(({ label, cls }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-slate-400">
              <span className={`w-4 h-4 rounded ${cls} inline-block`} />
              {label}
            </div>
          ))}
        </div>

        {/* Bus front indicator */}
        <div className="text-center text-xs text-slate-600 uppercase tracking-widest mb-5">
          🚌 Front
        </div>

        {/* Seat grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading seats…</div>
        ) : seats.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No seats found for this date.</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(rows).map(([row, rowSeats]) => (
              <div key={row} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-4 text-center shrink-0">{row}</span>
                <div className="flex flex-wrap gap-2">
                  {rowSeats.map((seat) => (
                    <button
                      key={seat.id}
                      className={getSeatClass(seat)}
                      onClick={() => toggle(seat)}
                      disabled={!seat.is_available}
                      title={seat.seat_number}
                    >
                      {seat.seat_number.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking panel */}
        {selected.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Seats selected</span>
                <strong className="text-white">{selected.length}</strong>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Price per seat</span>
                <strong className="text-white">৳{PRICE}</strong>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                <span className="font-semibold text-white">Total</span>
                <strong className="text-indigo-400 text-base">৳{selected.length * PRICE}</strong>
              </div>
            </div>
            <button
              onClick={handleBook}
              disabled={booking}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              {booking ? "Booking…" : `Book ${selected.length} Seat${selected.length > 1 ? "s" : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}