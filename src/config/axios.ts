import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,

});

// Attach the Frappe session id as a bearer token on every request.
apiClient.interceptors.request.use((config) => {
  const sid = localStorage.getItem("session_id");
  if (sid) {
    config.headers.Authorization = `Bearer ${sid}`;
  }
  return config;
});

// If the backend rejects the token, clear it so the app doesn't keep
// retrying with a dead sid — let the caller redirect to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("sid");
    }
    return Promise.reject(error);
  }
);

export default apiClient;