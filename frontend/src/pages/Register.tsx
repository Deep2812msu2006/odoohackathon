import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const { register, verifyRegistration, loading } = useAuth();
  const navigate = useNavigate();
  
  // Step 1 State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('FLEET MANAGER');
  
  // Step 2 State
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const starShadows = useMemo(() => {
    const generateStarShadows = (count: number) => {
      const shadows = [];
      for (let i = 0; i < count; i++) {
        const x = Math.floor(Math.random() * 2000);
        const y = Math.floor(Math.random() * 2000);
        shadows.push(`${x}px ${y}px #ffffff`);
      }
      return shadows.join(', ');
    };
    return {
      slow: generateStarShadows(150),
      medium: generateStarShadows(100),
      fast: generateStarShadows(50),
    };
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register(name, email, password, confirmPassword, role);
      setSuccess('Verification code sent to your email.');
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed. Try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await verifyRegistration(email, otp);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8" style={{
      background: 'radial-gradient(ellipse at bottom, #2b1836 0%, #060a0d 100%)',
    }}>
      {/* Parallax Stars Layers */}
      <div className="safety-stars-layer animate-stars-slow" style={{ width: '1px', height: '1px', boxShadow: starShadows.slow }} />
      <div className="safety-stars-layer animate-stars-medium" style={{ width: '2px', height: '2px', boxShadow: starShadows.medium }} />
      <div className="safety-stars-layer animate-stars-fast" style={{ width: '3px', height: '3px', boxShadow: starShadows.fast }} />

      <div className="relative z-10 w-full max-w-lg space-y-8 mt-12 mb-12">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-violet-650 font-bold text-white shadow-xl shadow-orange-500/20 text-2xl">
            TO
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 to-violet-400 bg-clip-text text-transparent sm:text-4xl glow-text-orange" style={{ textShadow: '0 0 10px rgba(249,115,22,0.2)' }}>
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {step === 1 ? 'Join the TransitOps Platform' : 'Verify your email to continue'}
          </p>
        </div>

        <div className="glass-panel p-8 bg-slate-900/40 backdrop-blur-md border border-slate-800 shadow-[0_0_40px_rgba(139,92,246,0.12)]">
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleRegisterSubmit}>
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-400 text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.2)] focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.2)] focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.2)] focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.2)] focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.2)] focus:outline-none transition-all duration-200"
                >
                  <option value="FLEET_MANAGER">Fleet Manager</option>
                  <option value="DRIVER">Driver</option>
                  <option value="SAFETY_OFFICER">Safety Officer</option>
                  <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3 text-sm btn-gradient active:scale-[0.99] transition-transform duration-100"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto"></div>
                ) : (
                  'Sign Up'
                )}
              </button>
              
              <div className="text-center text-sm text-slate-400 mt-4">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-orange-400 hover:text-orange-300 font-semibold"
                >
                  Sign In
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-400 text-center">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-400 text-center">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Enter 6-Digit Code
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.2)] focus:outline-none transition-all duration-200 text-center tracking-[1em] font-mono text-xl"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="relative w-full py-3 text-sm btn-gradient active:scale-[0.99] transition-transform duration-100"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto"></div>
                ) : (
                  'Verify & Login'
                )}
              </button>
              
              <div className="text-center text-sm text-slate-400 mt-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-300 font-medium"
                >
                  Back to Registration
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
