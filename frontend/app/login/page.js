'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  // Register form state
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

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden" 
      onMouseMove={handleMouseMove}
    >
      {/* Interactive Glowing Background Balls */}
      <div 
        className="glowing-ball interactive-orb" 
        style={{ 
          left: '10%', top: '20%',
          transform: `translate(${(mousePos.x - windowSize.width / 2) * -0.05}px, ${(mousePos.y - windowSize.height / 2) * -0.05}px)`
        }}
      ></div>
      <div 
        className="glowing-ball interactive-orb" 
        style={{ 
          right: '5%', bottom: '10%', 
          animationDelay: '-10s', 
          background: 'radial-gradient(circle, rgba(192,132,252,0.6) 0%, rgba(192,132,252,0) 70%)',
          transform: `translate(${(mousePos.x - windowSize.width / 2) * 0.05}px, ${(mousePos.y - windowSize.height / 2) * 0.05}px)`
        }}
      ></div>

      <div className="w-full max-w-md relative z-10 backdrop-blur-sm bg-background/40 p-8 rounded-2xl border border-card-border shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent mx-auto mb-4">
            <LogIn size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">DBMS</h1>
          <p className="mt-1 text-sm text-muted">Distributed Blockchain Monitoring System</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              tab === 'login'
                ? 'bg-accent text-white'
                : 'bg-card text-muted hover:text-foreground'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              tab === 'register'
                ? 'bg-accent text-white'
                : 'bg-card text-muted hover:text-foreground'
            }`}
          >
            Register
          </button>
        </div>

        {/* Info Alert for Registration */}
        {tab === 'register' && (
          <div className="mb-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <p className="text-xs text-warning">
              <strong>ℹ️ Registration is for regular users only.</strong> Admin accounts are created by existing administrators.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                placeholder="Enter your username"
                className="w-full rounded-lg border border-card-border bg-card px-4 py-2 text-foreground placeholder-muted focus:border-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-card-border bg-card px-4 py-2 pr-10 text-foreground placeholder-muted focus:border-accent focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <p className="text-xs text-muted text-center">
              Demo: admin / password123
            </p>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Username</label>
              <input
                type="text"
                value={registerForm.username}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, username: e.target.value })
                }
                placeholder="Choose a username"
                className="w-full rounded-lg border border-card-border bg-card px-4 py-2 text-foreground placeholder-muted focus:border-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, email: e.target.value })
                }
                placeholder="Enter your email"
                className="w-full rounded-lg border border-card-border bg-card px-4 py-2 text-foreground placeholder-muted focus:border-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, password: e.target.value })
                  }
                  placeholder="Create a password (min 6 characters)"
                  className="w-full rounded-lg border border-card-border bg-card px-4 py-2 pr-10 text-foreground placeholder-muted focus:border-accent focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={registerForm.confirmPassword}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm your password"
                  className="w-full rounded-lg border border-card-border bg-card px-4 py-2 pr-10 text-foreground placeholder-muted focus:border-accent focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted">
          This is a demo authentication system for testing purposes.
        </p>
      </div>
    </div>
  );
}
