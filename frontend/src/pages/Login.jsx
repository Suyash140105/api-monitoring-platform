import React, { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Success message if redirected after registration
  const successMessage = location.state?.message;
  const fromPath = location.state?.from?.pathname || "/";

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data.token, data.user);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 space-y-6 shadow-xl">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center gap-2 font-bold text-2xl text-white">
            <Zap className="text-yellow-400 fill-yellow-400" size={28} />
            <span>PulseMonitor</span>
          </div>
          <p className="text-sm text-zinc-400">Sign in to your monitoring dashboard</p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 text-sm bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Email Address</label>
            <input
              type="email"
              required
              autoFocus
              className="w-full bg-accent/50 border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Password</label>
            <input
              type="password"
              required
              className="w-full bg-accent/50 border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 py-2.5 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Link to Register */}
        <div className="text-center text-xs text-zinc-400 pt-2 border-t border-border">
          Don't have an account?{" "}
          <Link to="/register" className="text-white hover:underline font-medium">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
