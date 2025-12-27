
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Zap, 
  Loader2, 
  User as UserIcon, 
  Fingerprint, 
  Lock, 
  Key, 
  ArrowRight, 
  Terminal,
  AlertCircle,
  History,
  CloudUpload,
  Wifi,
  WifiOff
} from 'lucide-react';

const AuthPortal: React.FC = () => {
  const { login, signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.length < 3) {
      setError("PROTOCOL REJECTION: Codename must be at least 3 characters.");
      return;
    }

    if (password.length < 4) {
      setError("PROTOCOL REJECTION: Mana Signature too weak (Min 4 chars).");
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError("MANA MISMATCH: Passwords do not match.");
      return;
    }

    try {
      let success = false;
      if (mode === 'login') {
        success = await login(username, password);
        if (!success) {
          setError(isOnline 
            ? "ACCESS DENIED: Records do not match Dimensional Vault." 
            : "ACCESS DENIED: Offline mode cannot verify unknown Hunters.");
        }
      } else {
        if (!isOnline) {
          setError("PROTOCOL BREACH: Awakening requires a Cloud connection.");
          return;
        }
        success = await signup(username, password);
        if (!success) setError("AWAKENING FAILED: Codename already claimed.");
      }

      if (success) {
        navigate('/');
      }
    } catch (err) {
      setError("SYSTEM CRITICAL: Unstable dimensional link.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative font-['Rajdhani']">
      <div className="grid-bg opacity-20" />
      
      {/* Background Energy Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md status-window p-8 bg-slate-900/95 border-sky-500 relative z-10 animate-fade-in shadow-[0_0_50px_rgba(56,189,248,0.15)]">
        
        {/* Connection Badge */}
        <div className={`absolute -top-3 right-8 px-3 py-1 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest border ${isOnline ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/80' : 'border-rose-500/50 text-rose-400 bg-rose-950/80'}`}>
          {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
          {isOnline ? 'Vault Linked' : 'Vault Offline'}
        </div>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-2 border-sky-400 flex items-center justify-center bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              {isLoading ? (
                <Loader2 className="text-sky-400 animate-spin" size={32} />
              ) : mode === 'login' ? (
                <History className="text-sky-400" size={32} />
              ) : (
                <ShieldCheck className="text-sky-400" size={32} />
              )}
            </div>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white neon-text leading-none">
            The System
          </h1>
          <p className="text-[9px] uppercase font-bold text-sky-500 tracking-[0.4em] mt-2 opacity-80">
            {mode === 'login' ? 'Synchronize Identity' : 'Commence Global Awakening'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-500/50 flex items-start gap-3 animate-shake">
            <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest leading-relaxed">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-sky-500 tracking-widest flex items-center gap-2">
              <UserIcon size={12} /> Dimensional Codename
            </label>
            <div className="relative">
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="HUNTER_ID"
                className="w-full bg-slate-950 border border-sky-500/30 p-3 text-white font-bold tracking-widest outline-none focus:border-sky-400 focus:shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all"
              />
              <Fingerprint className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-500/20" size={16} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-sky-500 tracking-widest flex items-center gap-2">
              <Key size={12} /> Mana Signature (Password)
            </label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-sky-500/30 p-3 text-white font-bold tracking-widest outline-none focus:border-sky-400 transition-all"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-2 animate-slide-up">
              <label className="text-[10px] uppercase font-black text-emerald-500 tracking-widest flex items-center gap-2">
                <ShieldCheck size={12} /> Verify Signature
              </label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-emerald-500/30 p-3 text-white font-bold tracking-widest outline-none focus:border-emerald-400 transition-all"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 font-black uppercase italic tracking-tighter flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
              mode === 'signup' 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
              : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            {isLoading ? (
              <>Establishing Link... <Loader2 className="animate-spin" size={18} /></>
            ) : mode === 'login' ? (
              <>Establish Connection <ArrowRight size={18} /></>
            ) : (
              <>Awaken Profile <Zap size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-sky-500/10 text-center">
          <button 
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-sky-400 transition-colors"
          >
            {mode === 'login' 
              ? "New Subject? [COMMENCE AWAKENING]" 
              : "Existing Monarch? [SYNCHRONIZE DATA]"}
          </button>
        </div>

        <div className="mt-8 p-4 bg-slate-950 border border-sky-900/30 flex items-start gap-4">
          <CloudUpload className="text-emerald-500 flex-shrink-0" size={16} />
          <p className="text-[8px] text-slate-500 uppercase font-medium leading-relaxed tracking-wider">
            Protocol: Identity data is anchored to your Codename. Persistence is mirrored across dimensional instances (reloads).
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPortal;
