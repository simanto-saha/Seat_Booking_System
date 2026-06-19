const BASE_URL = "http://localhost:8000/booking";


function getCsrfToken() {
  const name = "csrftoken";
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + "=")) {
      return decodeURIComponent(cookie.slice(name.length + 1));
    }
  }
  return "";
}

const api = async (endpoint, options = {}) => {
  const method = options.method || "GET";
  const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(isWriteMethod ? { "X-CSRFToken": getCsrfToken() } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
};

export const createAccount         = (body) => api("/create_account/",          { method: "POST", body: JSON.stringify(body) });
export const loginApi              = (body) => api("/login/",                    { method: "POST", body: JSON.stringify(body) });
export const logoutApi             = ()     => api("/logout/");
export const generateOtp           = (body) => api("/generate-otp/",             { method: "POST", body: JSON.stringify(body) });
export const verifyOtp             = (body) => api("/verify-otp/",               { method: "POST", body: JSON.stringify(body) });
export const sendRegistrationOtp   = (body) => api("/send-registration-otp/",   { method: "POST", body: JSON.stringify(body) });
export const verifyRegistrationOtp = (body) => api("/verify-registration-otp/", { method: "POST", body: JSON.stringify(body) });
export const getHome               = ()     => api("/");
export const getSeats              = (date) => api(`/seats/?date=${date}`);
export const bookSeats             = (body) => api("/book/",                     { method: "POST", body: JSON.stringify(body) });
export const cancelBooking         = (id)   => api(`/cancel/${id}/`,            { method: "POST" });
export const myBookings            = ()     => api("/my-bookings/");