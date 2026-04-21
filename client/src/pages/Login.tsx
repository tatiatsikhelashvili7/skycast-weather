import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DynamicBackground } from "../components/DynamicBackground";
import { TimeMachineProvider } from "../context/TimeMachineContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <TimeMachineProvider>
    <div className="min-h-[100dvh] flex items-center justify-center px-4">
      <DynamicBackground />
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        onSubmit={handleSubmit}
        className="glass-strong rounded-3xl p-8 w-full max-w-md"
      >
        <div className="text-display text-3xl font-semibold mb-1">Welcome back</div>
        <p className="text-white/60 text-sm mb-8">
          Sign in to save your favorite cities.
        </p>

        <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">
          Email
        </label>
        <div className="relative mb-4">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            className="label-input pl-11"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">
          Password
        </label>
        <div className="relative mb-6">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            className="label-input pl-11"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {err && (
          <div className="mb-4 text-sm text-rose-200 bg-rose-500/10 border border-rose-300/20 rounded-xl px-4 py-2">
            {err}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <LogIn className="w-4 h-4" />
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="text-sm text-white/60 text-center mt-6">
          New here?{" "}
          <Link to="/register" className="text-white hover:underline">
            Create an account
          </Link>
        </div>
      </motion.form>
    </div>
    </TimeMachineProvider>
  );
}
