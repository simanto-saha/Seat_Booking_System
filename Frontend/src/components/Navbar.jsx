import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "text-white bg-white/10 px-3 py-1.5 rounded-lg"
      : "text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isGuest = !user || user.role === "guest";
  const userName = user?.message?.replace("Welcome, ", "").replace("!", "") ?? "";

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-white text-lg shrink-0">
          <span className="text-2xl">🪑</span>
          <span>SeatBook</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 flex-1">
          <Link to="/" className={isActive("/")}>Seats</Link>
          {!isGuest && (
            <Link to="/my-bookings" className={isActive("/my-bookings")}>My Bookings</Link>
          )}
        </div>

        {/* Auth actions */}
        <div className="flex items-center gap-3 shrink-0">
          {isGuest ? (
            <>
              <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <span className="text-sm text-slate-400 max-w-[150px] truncate">
                {user.role === "admin" ? "👑" : "👤"} {userName}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}