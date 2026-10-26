import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, KeyRound, Mail, User as UserIcon, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SUPPORTED_NATIVE_LANGUAGES } from '../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, login, signup } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>(authModalTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('telugu');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync tab with context when modal opens
  React.useEffect(() => {
    setTab(authModalTab);
    setError(null);
    setSuccessMsg(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Failed to sign in. Please verify credentials.');
        }
      } else if (tab === 'signup') {
        const res = await signup(name, email, password, defaultLanguage);
        if (!res.success) {
          setError(res.error || 'Failed to sign up.');
        }
      } else if (tab === 'forgot') {
        const res = await fetch('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMsg(data.message || 'Password reset successfully. You can now sign in.');
          setTimeout(() => setTab('login'), 2000);
        } else {
          setError(data.error || 'Password reset failed.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    const res = await login('student@bhashacode.com', 'Learner@2026');
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Demo login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-[#E1DFDD] p-6 sm:p-8 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-sm text-stone-400 hover:text-[#242424] hover:bg-stone-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-sm bg-[#EBF3FC] text-[#0078D4] mb-3 font-bold text-lg border border-[#0078D4]/20">
            భ
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#242424]">
            {tab === 'login' && 'Sign in to Microsoft 365'}
            {tab === 'signup' && 'Create your free account'}
            {tab === 'forgot' && 'Reset Password'}
          </h3>
          <p className="text-xs text-[#616161] mt-1.5">
            {tab === 'login' && 'Continue your multilingual programming journey with BhashaCode.'}
            {tab === 'signup' && 'No credit card required. Free 20 AI code explanations daily.'}
            {tab === 'forgot' && 'Enter your account email and choose a new password.'}
          </p>
        </div>

        {/* Tab switch */}
        {tab !== 'forgot' && (
          <div className="flex p-1 bg-[#F5F6F8] rounded-sm mb-5 border border-[#E1DFDD]">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xs transition-colors ${
                tab === 'login' ? 'bg-white text-[#0067B8] shadow-2xs border border-[#E1DFDD]' : 'text-[#616161] hover:text-[#242424]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xs transition-colors ${
                tab === 'signup' ? 'bg-white text-[#0067B8] shadow-2xs border border-[#E1DFDD]' : 'text-[#616161] hover:text-[#242424]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Demo Account Quick Access */}
        {tab === 'login' && (
          <div className="mb-5 p-3 rounded-md bg-[#EBF3FC] border border-[#0078D4]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#242424]">Testing the platform?</p>
                <p className="text-[11px] text-[#616161]">Instant 1-click student demo credentials</p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0067B8] hover:bg-[#005A9E] rounded-[4px] shadow-2xs transition-colors shrink-0"
              >
                1-Click Demo
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-sm bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">Your Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#747474] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Reddy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-[2px] border border-[#E1DFDD] focus:border-[#0067B8] outline-hidden bg-[#F5F6F8]/50 text-[#242424]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#747474] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-[2px] border border-[#E1DFDD] focus:border-[#0067B8] outline-hidden bg-[#F5F6F8]/50 text-[#242424]"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#242424]">Password</label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); setError(null); }}
                    className="text-[11px] font-semibold text-[#0067B8] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#747474] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-[2px] border border-[#E1DFDD] focus:border-[#0067B8] outline-hidden bg-[#F5F6F8]/50 text-[#242424]"
                />
              </div>
            </div>
          )}

          {tab === 'forgot' && (
            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">New Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#747474] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="New password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-[2px] border border-[#E1DFDD] focus:border-[#0067B8] outline-hidden bg-[#F5F6F8]/50 text-[#242424]"
                />
              </div>
            </div>
          )}

          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Preferred Explanation Language
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-[#747474] absolute left-3 top-2.5" />
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-[2px] border border-[#E1DFDD] focus:border-[#0067B8] outline-hidden bg-[#F5F6F8]/50 text-[#242424]"
                >
                  {SUPPORTED_NATIVE_LANGUAGES.map((lang) => (
                    <option key={lang.key} value={lang.key}>
                      {lang.native} ({lang.english})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs sm:text-sm shadow-2xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {tab === 'login' && 'Sign in'}
                  {tab === 'signup' && 'Create free account'}
                  {tab === 'forgot' && 'Reset my password'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {tab === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className="text-xs font-semibold text-[#616161] hover:text-[#242424]"
            >
              Back to Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
