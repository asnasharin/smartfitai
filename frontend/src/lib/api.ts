import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not set");
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach JWT token (NOT firebase anymore)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // ✅ changed

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle global errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        console.error("Unauthorized - token invalid or expired");

        const isAuthPage =
          window.location.pathname.includes("/login") ||
          window.location.pathname.includes("/signup");

        if (!isAuthPage) {
          // ✅ clear JWT
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          // ✅ redirect
          localStorage.setItem(
            "authRedirectPath",
            window.location.pathname
          );

          window.location.href = "/login";
        }
      }

      if (status === 403) {
        console.error("Forbidden");
      }

      if (status >= 500) {
        console.error("Server error:", error.response.data);
      }
    } else {
      console.error("Network error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;