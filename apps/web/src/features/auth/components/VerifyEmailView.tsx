import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Loader2, CheckCircle2, AlertCircle, RotateCcw, ArrowLeft, ShieldCheck } from 'lucide-react';

export interface VerifyEmailViewProps {
  unconfirmedEmail?: string | null;
  userEmail?: string | null;
  checkVerification: () => Promise<boolean>;
  resendVerification: (email?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  onVerified: () => void;
  navigateTo: (path: string, options?: { replace?: boolean }) => void;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({
  unconfirmedEmail,
  userEmail,
  checkVerification,
  resendVerification,
  logout,
  onVerified,
  navigateTo
}) => {
  const displayEmail = unconfirmedEmail || userEmail || 'your email address';
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedTime = sessionStorage.getItem('writopedia_resend_cooldown_until');
      if (savedTime) {
        const remaining = Math.ceil((parseInt(savedTime, 10) - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      }
    }
    return 0;
  });
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // Mask email for privacy (e.g. p••••@example.com)
  const maskEmail = (email: string): string => {
    if (!email || !email.includes('@')) return email;
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}*@${domain}`;
    }
    const visibleStart = localPart.slice(0, 1);
    const visibleEnd = localPart.slice(-1);
    const masked = '•'.repeat(Math.max(3, Math.min(localPart.length - 2, 6)));
    return `${visibleStart}${masked}${visibleEnd}@${domain}`;
  };

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem('writopedia_resend_cooldown_until');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCheckVerification = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const verified = await checkVerification();
      if (verified) {
        setStatusMessage({ type: 'success', text: 'Email verified successfully! Redirecting...' });
        setTimeout(() => {
          onVerified();
        }, 1200);
      } else {
        setStatusMessage({
          type: 'info',
          text: 'Email verification is still pending. Please check your inbox and click the confirmation link.'
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Could not verify status. Please check your network and try again.'
      });
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setStatusMessage(null);
    try {
      const res = await resendVerification(unconfirmedEmail || userEmail || undefined);
      if (res.error) {
        setStatusMessage({
          type: 'error',
          text: res.error || "We couldn't resend the verification email right now. Please try again in a moment."
        });
      } else {
        const cooldownSeconds = 60;
        setResendCooldown(cooldownSeconds);
        sessionStorage.setItem('writopedia_resend_cooldown_until', (Date.now() + cooldownSeconds * 1000).toString());
        setStatusMessage({
          type: 'success',
          text: `Verification email sent! Please check your inbox and Spam/Junk folder.`
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: "Failed to resend confirmation. Please wait a moment and try again."
      });
    } finally {
      setResending(false);
    }
  };

  const handleBackToSignIn = async () => {
    await logout();
    navigateTo('/login');
  };

  return (
    <div className="w-full h-full min-h-screen flex bg-[#090d16] text-white">
      {/* Left Side - Enterprise Creative Suite Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden items-end p-16 border-r border-slate-850">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-slate-950/90 to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-lg space-y-4">
          <h1 className="text-4xl font-light text-white tracking-tight leading-tight">
            Enterprise <br />
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-500 to-rose-300">
              Creative Suite
            </span>
          </h1>
          <p className="text-sm text-slate-400 font-light leading-relaxed">
            Powered by advanced creative intelligence. Define your brand's strategic parameters to unlock tailored, high-impact campaigns and visual assets.
          </p>
        </div>
      </div>

      {/* Right Side - Verification Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Header */}
          <div className="space-y-3">
            <div className="relative inline-block pb-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Email Verification Required
              </h2>
              <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-rose-600" />
            </div>
            <p className="text-slate-400 font-light text-sm">
              Your account is almost ready. Please confirm your email address to activate your workspace.
            </p>
          </div>

          {/* Email Information Box */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-600/10 text-rose-500 rounded-sm shrink-0 border border-rose-600/20">
                <Mail size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Verification Link Sent To
                </span>
                <span className="font-mono text-sm text-white font-semibold truncate block" title={displayEmail}>
                  {maskEmail(displayEmail)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-light leading-relaxed border-t border-slate-800/80 pt-2.5">
              Please check your inbox and <span className="text-slate-300 font-medium">Spam/Junk folder</span>, then click the confirmation link to activate your account.
            </p>
          </div>

          {/* Dynamic Status Feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-sm text-xs leading-normal flex items-start gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck size={16} className="text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleCheckVerification}
              disabled={checking}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 rounded-sm transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Checking Verification Status...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> I've Verified My Email
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="w-full border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-200 font-semibold text-xs py-2.5 rounded-sm transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>Resend available in {resendCooldown}s</>
              ) : (
                <>
                  <RotateCcw size={13} /> Resend Verification Email
                </>
              )}
            </button>
          </div>

          {/* Back to Sign In */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleBackToSignIn}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} /> Change email / Back to Sign In
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
