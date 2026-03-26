'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { AlertCircle, Eye, EyeOff, ShieldAlert, Terminal, UserPlus } from 'lucide-react';
import CyberNetworkCanvas from '@/app/components/CyberNetworkCanvas';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginForm.username, loginForm.password);
      router.push('/user');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(registerForm.username, registerForm.email, registerForm.password);
      router.push('/user');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-zinc-200 placeholder-zinc-600 text-sm font-mono focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-900/40 transition-colors';
  const labelClass = 'block text-[10px] font-mono font-medium text-zinc-500 mb-1.5 tracking-[0.2em] uppercase';

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-black">

      {/* ── Cyber network background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.4 }}>
        <CyberNetworkCanvas />
      </div>

      {/* ── Scanlines ── */}
      <div
        className="fixed inset-0 z-1 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
        }}
      />

      {/* ── Subtle red grid ── */}
      <div
        className="fixed inset-0 z-1 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(180,40,40,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(180,40,40,0.018) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Radial vignette to keep focus on the card ── */}
      <div
        className="fixed inset-0 z-1 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* ── Card ── */}
      <div className="w-full max-w-md relative z-10">

        {/* Corner reticle brackets */}
        <div className="absolute -top-2 -left-2 w-5 h-5 border-t border-l border-red-800/50" />
        <div className="absolute -top-2 -right-2 w-5 h-5 border-t border-r border-red-800/50" />
        <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b border-l border-red-800/50" />
        <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b border-r border-red-800/50" />

        <div className="backdrop-blur-md bg-black/75 p-8 rounded-lg border border-red-950/50 shadow-2xl shadow-black/60">

          {/* ── Header ── */}
          <div className="text-center mb-7">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
              <span className="font-mono text-[9px] text-zinc-600 tracking-[0.3em] uppercase">System Online</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-950/60 border border-red-900/40 mx-auto mb-3" style={{ boxShadow: '0 0 20px rgba(153,17,17,0.25)' }}>
              <ShieldAlert size={20} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-[0.22em] text-white font-mono">DBMS</h1>
            <p className="mt-1 text-[10px] text-zinc-600 font-mono tracking-[0.2em] uppercase">
              Distributed Blockchain Monitoring
            </p>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1.5 mb-6 p-1 rounded-lg bg-zinc-950/70 border border-zinc-800/40">
            <button
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md font-mono text-[11px] font-medium tracking-widest uppercase transition-all ${
                tab === 'login'
                  ? 'bg-red-950/70 text-red-300 border border-red-900/50 shadow-sm shadow-red-950/30'
                  : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              <Terminal size={11} />
              Login
            </button>
            <button
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md font-mono text-[11px] font-medium tracking-widest uppercase transition-all ${
                tab === 'register'
                  ? 'bg-red-950/70 text-red-300 border border-red-900/50 shadow-sm shadow-red-950/30'
                  : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              <UserPlus size={11} />
              Register
            </button>
          </div>

          {/* ── Register note ── */}
          {tab === 'register' && (
            <div className="mb-4 rounded-lg border border-amber-900/30 bg-amber-950/15 p-3">
              <p className="text-[11px] font-mono text-amber-600/90 leading-relaxed">
                <span className="text-amber-500">// NOTE</span> &nbsp;Registration creates regular user accounts. Admin access is provisioned by administrators.
              </p>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-900/40 bg-red-950/20 p-3">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-[11px] font-mono text-red-400">{error}</p>
            </div>
          )}

          {/* ── Login Form ── */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Username</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter credential..."
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter passphrase..."
                    className={inputClass + ' pr-10'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-zinc-800/60" />
                <span className="text-[9px] font-mono text-zinc-700 tracking-widest">AUTHENTICATE</span>
                <div className="flex-1 h-px bg-zinc-800/60" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-linear-to-r from-red-950 to-red-900 border border-red-800/40 px-4 py-2.5 text-[11px] font-mono font-semibold text-red-200 tracking-[0.2em] uppercase transition-all hover:from-red-900 hover:to-red-800 hover:text-white hover:shadow-lg hover:shadow-red-950/40 disabled:opacity-40"
                style={{ boxShadow: '0 0 15px rgba(153,17,17,0.15)' }}
              >
                {loading ? '// Authenticating...' : '// Access System'}
              </button>
              <p className="text-[10px] text-zinc-700 text-center font-mono">
                // demo &nbsp;→&nbsp; admin / admin123
              </p>
            </form>
          )}

          {/* ── Register Form ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Username</label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  placeholder="Choose identifier..."
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="Enter email address..."
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Create passphrase (min 6)..."
                    className={inputClass + ' pr-10'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    placeholder="Confirm passphrase..."
                    className={inputClass + ' pr-10'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {showConfirmPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-zinc-800/60" />
                <span className="text-[9px] font-mono text-zinc-700 tracking-widest">PROVISION</span>
                <div className="flex-1 h-px bg-zinc-800/60" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-linear-to-r from-red-950 to-red-900 border border-red-800/40 px-4 py-2.5 text-[11px] font-mono font-semibold text-red-200 tracking-[0.2em] uppercase transition-all hover:from-red-900 hover:to-red-800 hover:text-white hover:shadow-lg hover:shadow-red-950/40 disabled:opacity-40"
                style={{ boxShadow: '0 0 15px rgba(153,17,17,0.15)' }}
              >
                {loading ? '// Provisioning...' : '// Create Account'}
              </button>
            </form>
          )}

          {/* ── Footer ── */}
          <p className="mt-6 text-center text-[9px] text-zinc-800 font-mono tracking-widest">
            // DBMS v2.0 — BLOCKCHAIN FORENSICS PLATFORM
          </p>
        </div>
      </div>
    </div>
  );
}
