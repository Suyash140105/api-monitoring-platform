import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Zap, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";

export default function Register() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Simpler, safer approach: Redirect to login with success message banner
      navigate("/login", {
        replace: true,
        state: { message: "Account created successfully! Please sign in with your credentials." },
      });
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
          <p className="text-sm text-zinc-400">Create an account to start monitoring your APIs</p>
        </div>

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
            <label className="text-xs font-medium text-zinc-300">Full Name</label>
            <input
              type="text"
              required
              autoFocus
              className="w-full bg-accent/50 border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              placeholder="Alice Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-accent/50 border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              placeholder="alice@example.com"
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
              placeholder="Minimum 6 characters"
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
                <span>Creating account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="text-center text-xs text-zinc-400 pt-2 border-t border-border">
          Already have an account?{" "}
          <Link to="/login" className="text-white hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
