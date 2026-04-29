import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, X, LogIn, UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDeviceTier } from "../../hooks/useDeviceTier";
interface Props {
    onClose: () => void;
}
type Mode = "login" | "register";
export function AuthModal({ onClose }: Props) {
    const { login, register } = useAuth();
    const tier = useDeviceTier();
    const disableLayout = tier.isMobile || tier.isLowEnd || tier.saveData;
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === "login")
                await login(email, password);
            else
                await register(email, password);
            onClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
        finally {
            setLoading(false);
        }
    }
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} onClick={(e) => e.stopPropagation()} className="relative glass-strong rounded-[1.75rem] sm:rounded-[2rem] p-6 sm:p-8 md:p-10 max-w-md w-full max-h-[calc(100svh-2rem)] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors" aria-label="Close">
          <X className="w-4 h-4"/>
        </button>

        
        <div className="glass rounded-2xl p-1 flex mb-6 relative">
          {(["login", "register"] as Mode[]).map((m) => (<button key={m} onClick={() => {
                setMode(m);
                setError(null);
            }} className="flex-1 relative py-2 text-sm font-medium z-10">
              {mode === m && (<motion.span layoutId={disableLayout ? undefined : "auth-tab-pill"} className="absolute inset-0 rounded-xl bg-white/15 border border-white/15" transition={disableLayout
                    ? { duration: 0.18 }
                    : { type: "spring", stiffness: 400, damping: 32 }}/>)}
              <span className={`relative ${mode === m ? "text-white" : "text-white/55"}`}>
                {m === "login" ? "Sign in" : "Register"}
              </span>
            </button>))}
        </div>

        <h2 className="text-display text-2xl md:text-3xl font-semibold">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h2>
        <p className="text-white/55 text-sm mt-1.5">
          {mode === "login"
            ? "Sign in to save your favorite cities."
            : "Save favorites and your search history."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-white/50">
              Email
            </span>
            <div className="relative mt-1.5">
              <Mail className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3.5 text-white/40"/>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="label-input pl-10" autoComplete="email"/>
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-white/50">
              Password
            </span>
            <div className="relative mt-1.5">
              <Lock className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3.5 text-white/40"/>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="label-input pl-10" autoComplete={mode === "login" ? "current-password" : "new-password"}/>
            </div>
          </label>

          {error && (<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-200 bg-rose-500/10 border border-rose-400/20 rounded-xl p-3">
              {error}
            </motion.div>)}

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-60">
            {loading ? (<Loader2 className="w-4 h-4 animate-spin"/>) : mode === "login" ? (<LogIn className="w-4 h-4"/>) : (<UserPlus className="w-4 h-4"/>)}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </motion.div>
    </motion.div>);
}
