import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import MyBookings from "./pages/MyBookings";

// Layout: Navbar + page content
function Layout() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <Outlet />
    </div>
  );
}

// Redirect logged-in users away from auth pages
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.role !== "guest") return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Pages WITH Navbar */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/my-bookings" element={<MyBookings />} />
      </Route>

      {/* Auth pages — NO Navbar */}
      <Route path="/login"           element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register"        element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}