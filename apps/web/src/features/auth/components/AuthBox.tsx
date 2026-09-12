import React, { useState } from 'react';
import { Loader2, Check, Copy, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';

export interface AuthBoxProps {
  user: any;
  login: () => void;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<any>;
  resetPassword?: (email: string) => Promise<{ error?: string }>;
  authError?: string | null;
  setAuthError: (err: string | null) => void;
  navigateTo?: (path: string, options?: { replace?: boolean }) => void;
  titleText?: string;
  subText?: string;
}

export const AuthBox: React.FC<AuthBoxProps> = ({ 
  user, 
  login, 
  loginWithEmail, 
  registerWithEmail, 
  resetPassword,
  authError,
  setAuthError,
  navigateTo,
  titleText = "Sign In or Register",
  subText = "Access your established creative profile"
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const [copiedDomain, setCopiedDomain] = useState(false);
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDomainError =
    (formError && formError.includes('Domain Authorization Required')) ||
    (authError && authError.includes('Domain Authorization Required'));

  const handleCopyHostname = () => {
    if (navigator.clipboard && currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const validateInputs = (): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setFormError("Email address is required.");
      return false;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError("Please enter a valid email address.");
      return false;
    }
    if (mode !== 'forgot_password') {
      if (!password) {
        setFormError("Password is required.");
        return false;
      }
      if (mode === 'signup' && password.length < 6) {
        setFormError("Password must be at least 6 characters.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    const cleanEmail = email.trim().toLowerCase();
    setSubmitting(true);
    setFormError(null);
    setAuthError(null);

    try {
      if (mode === 'signin') {
        const res = await loginWithEmail(cleanEmail, password);
        if (res?.isEmailUnconfirmed) {
          if (navigateTo) {
            navigateTo('/verify-email');
          }
        }
      } else if (mode === 'signup') {
        const res = await registerWithEmail(cleanEmail, password, name.trim() || undefined);
        if (res?.isEmailUnconfirmed) {
          if (navigateTo) {
            navigateTo('/verify-email');
          }
        }
      } else if (mode === 'forgot_password') {
        if (resetPassword) {
          const res = await resetPassword(cleanEmail);
          if (res.error) throw new Error(res.error);
        }
        setResetSent(true);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Authentication failed. Please verify your details.";
      if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('verify your email')) {
        if (navigateTo) {
          navigateTo('/verify-email');
          return;
        }
      }
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full text-left mt-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {mode === 'forgot_password' ? "Reset Password" : titleText}
        </h3>
        {subText && mode !== 'forgot_password' && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subText}</p>
        )}
        {mode === 'forgot_password' && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Enter your email to receive a secure password recovery link.
          </p>
        )}
      </div>

      {/* Tabs (Only in signin or signup mode) */}
      {mode !== 'forgot_password' ? (
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('signin'); setFormError(null); }}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${
              mode === 'signin' 
                ? 'border-rose-600 text-rose-600 dark:border-rose-500 dark:text-rose-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setFormError(null); }}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${
              mode === 'signup' 
                ? 'border-rose-600 text-rose-600 dark:border-rose-500 dark:text-rose-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Sign Up
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setMode('signin'); setFormError(null); setResetSent(false); }}
          className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-400 font-semibold cursor-pointer py-1"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </button>
      )}

      {resetSent ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-sm text-xs text-emerald-800 dark:text-emerald-200 space-y-2">
          <div className="font-bold flex items-center gap-1.5">
            <Check size={14} className="text-emerald-500" /> Password Reset Link Sent
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            If an account exists for <span className="font-mono text-white">{email}</span>, we've sent password reset instructions to your inbox.
          </p>
          <button
            type="button"
            onClick={() => { setMode('signin'); setResetSent(false); }}
            className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            Return to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Full Name (Optional)
              </label>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm focus:border-rose-500 focus:outline-none focus:ring-0 text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm focus:border-rose-500 focus:outline-none focus:ring-0 text-slate-900 dark:text-white"
            />
          </div>

          {mode !== 'forgot_password' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot_password'); setFormError(null); }}
                    className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={mode === 'signup' ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? "At least 6 characters" : "••••••••"}
                  className="w-full text-xs pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm focus:border-rose-500 focus:outline-none focus:ring-0 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                  Must be at least 6 characters.
                </p>
              )}
            </div>
          )}

          {(formError || authError) && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-sm text-[11px] text-rose-700 dark:text-rose-300 leading-normal space-y-2">
              <div>{formError || authError}</div>
              {isDomainError && currentHostname && (
                <div className="pt-1.5 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800 text-slate-800 dark:text-slate-200 truncate max-w-50">
                    {currentHostname}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHostname}
                    className="flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer shrink-0"
                  >
                    {copiedDomain ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {copiedDomain ? 'Copied!' : 'Copy Domain'}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400 text-white font-bold text-xs py-2.5 rounded-sm transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                {mode === 'signin' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending link...'}
              </>
            ) : (
              mode === 'signin' ? 'Sign In & Connect' : mode === 'signup' ? 'Register Account' : 'Send Recovery Link'
            )}
          </button>
        </form>
      )}

      {/* Divider & Google Button (Only in signin or signup mode) */}
      {mode !== 'forgot_password' && !resetSent && (
        <>
          <div className="relative flex items-center py-1">
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="shrink mx-3 text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              or continue with
            </span>
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <button 
            type="button"
            onClick={() => login()}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-sm font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </>
      )}
    </div>
  );
};
