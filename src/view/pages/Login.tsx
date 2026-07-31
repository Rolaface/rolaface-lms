import { useState } from "react";
import axios from "axios";
import { useNavigate } from "@tanstack/react-router";

export default function Login() {
  const navigate = useNavigate();

  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
     const response = await axios.post(
  "http://localhost:5173/api/method/auth_api.user_management.api.auth.login",
  {
    usr,
    pwd,
  },
  {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  }
);

      console.log("Login Success:", response.data);

      navigate({ to: "/" });
    } catch (error: any) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.exc ||
        "Login failed";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow"
      >
        <h1 className="mb-6 text-center text-2xl font-bold">Login</h1>

        <input
          type="text"
          placeholder="Username"
          value={usr}
          onChange={(e) => setUsr(e.target.value)}
          className="mb-4 w-full rounded border px-3 py-2"
        />

        <input
          type="password"
          placeholder="Password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          className="mb-4 w-full rounded border px-3 py-2"
        />

        {error && (
          <p className="mb-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Signing In..." : "Login"}
        </button>
      </form>
    </div>
  );
}