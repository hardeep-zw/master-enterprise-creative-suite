import React, { useState } from 'react';
import { 
  Rocket, 
  Tag, 
  Shield, 
  MessageSquare, 
  Info, 
  Check, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Coins,
  ArrowRight, 
  X, 
  Menu,
  Mail, 
  Phone, 
  Clock, 
  Lock, 
  Compass, 
  Briefcase 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { submitSalesInquiry } from '@web/infrastructure/repositories/salesRepository.js';

// Custom, highly accurate logo component displaying the uploaded brand asset from the public folder
export function WritopediaLogo({ className = "h-9 sm:h-10", onClick }: { className?: string; onClick?: () => void }) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className={`flex items-center gap-2 cursor-pointer select-none ${className}`} onClick={handleClick}>
      <img 
        src="/logo.png" 
        alt="Writopedia Logo" 
        className="h-full w-auto object-contain max-h-[38px]" 
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

interface LandingPageProps {
  onOpenWorkspace: () => void;
  onLogin: () => void;
  navigateTo?: (path: string) => void;
  user?: any;
  credits?: number;
}

export default function LandingPage({ onOpenWorkspace, onLogin, navigateTo, user, credits }: LandingPageProps) {
  const [activeModal, setActiveModal] = useState<'plans' | 'legal' | 'contact' | 'about' | 'documentation' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms' | 'refund'>('privacy');

  const openContactModal = () => {
    setContactError(null);
    if (user) {
      setContactForm(prev => ({
        ...prev,
        email: prev.email || user.email || '',
        name: prev.name || user.displayName || user.user_metadata?.full_name || ''
      }));
    }
    setActiveModal('contact');
  };

  const closeContactModal = () => {
    setActiveModal(null);
    if (contactSubmitted) {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
      setContactError(null);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingContact) return;

    const trimmedName = contactForm.name.trim();
    const trimmedEmail = contactForm.email.trim();
    const trimmedMessage = contactForm.message.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setContactError('Please provide your full name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setContactError('Please enter a valid business email address.');
      return;
    }

    if (!trimmedMessage || trimmedMessage.length < 5) {
      setContactError('Please describe your requirements (at least 5 characters).');
      return;
    }

    setIsSubmittingContact(true);
    setContactError(null);

    try {
      await submitSalesInquiry('landing_lead', {
        companyName: 'Landing Page Lead',
        contactName: trimmedName,
        email: trimmedEmail,
        teamSize: 'Enterprise Inquiry',
        message: trimmedMessage,
        status: 'pending',
        timestamp: Date.now()
      });
      setContactSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit contact query:', err);
      setContactError('Unable to send your message right now. Please try again or email business@writopedia.com directly.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] bg-[#fafafc] text-slate-800 font-sans relative overflow-x-hidden flex flex-col justify-between selection:bg-crimson/10 selection:text-crimson">
      {/* Subtle Dot Matrix Background Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-75 pointer-events-none" />

      {/* 1. Header (Balanced Desktop Scale: 72–76px, Responsive Mobile Bar: 64–70px) */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-150/80 px-4 sm:px-6 lg:px-8 h-[64px] sm:h-[70px] lg:h-[76px] shrink-0 flex items-center">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <WritopediaLogo className="h-8 sm:h-9 lg:h-10 shrink-0" onClick={() => navigateTo ? navigateTo('/') : undefined} />

          {/* Nav Center (Desktop / Tablet Landscape) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[14px] font-medium text-slate-600">
            <button 
              onClick={onOpenWorkspace}
              className="hover:text-crimson transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button 
              onClick={() => { if (navigateTo) { navigateTo('/pricing'); } else { setActiveModal('plans'); } }}
              className="hover:text-crimson transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <a 
              href="https://writopedia.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-crimson transition-colors cursor-pointer"
            >
              Website
            </a>
            <button 
              onClick={openContactModal}
              className="hover:text-crimson transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Right Action */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Credit Balance Badge */}
              <div 
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-slate-700 text-xs font-semibold select-none"
                title="Your available creative credits"
              >
                <Coins size={13} className="text-amber-500 shrink-0" />
                <span>{typeof credits === 'number' ? `${credits} credits` : 'Credits'}</span>
              </div>

              {/* User Identity */}
              <div 
                className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 font-medium max-w-[150px] truncate select-none" 
                title={user.email || 'Authenticated User'}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{user.displayName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}</span>
              </div>

              {/* Go to Workspace Button */}
              <button 
                onClick={onOpenWorkspace}
                className="bg-crimson hover:bg-crimson/90 text-white text-[13px] lg:text-[14px] font-semibold px-4 sm:px-5 h-9 sm:h-10 rounded-full transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span>Go to Workspace</span>
                <ArrowRight size={14} className="shrink-0" />
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
              <button 
                onClick={onLogin}
                className="hidden sm:inline-flex text-[13px] lg:text-[14px] font-semibold text-slate-600 hover:text-crimson transition-colors px-2 py-1 cursor-pointer"
              >
                Log In
              </button>
              <button 
                onClick={onLogin}
                className="bg-crimson hover:bg-crimson/90 text-white text-[13px] lg:text-[14px] font-semibold px-4 sm:px-5 h-9 sm:h-10 rounded-full transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center shrink-0"
              >
                Sign Up
              </button>
              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-lg px-6 py-4 flex flex-col gap-3.5 z-50 text-left"
            >
              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenWorkspace(); }}
                className="text-[14px] font-medium text-slate-700 hover:text-crimson py-1 transition-colors text-left flex items-center justify-between"
              >
                <span>Platform</span>
                <ArrowRight size={15} className="text-slate-400" />
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); if (navigateTo) { navigateTo('/pricing'); } else { setActiveModal('plans'); } }}
                className="text-[14px] font-medium text-slate-700 hover:text-crimson py-1 transition-colors text-left flex items-center justify-between"
              >
                <span>Pricing</span>
                <ArrowRight size={15} className="text-slate-400" />
              </button>
              <a
                href="https://writopedia.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[14px] font-medium text-slate-700 hover:text-crimson py-1 transition-colors text-left flex items-center justify-between"
              >
                <span>Website</span>
                <ArrowRight size={15} className="text-slate-400" />
              </a>
              <button
                onClick={() => { setIsMobileMenuOpen(false); openContactModal(); }}
                className="text-[14px] font-medium text-slate-700 hover:text-crimson py-1 transition-colors text-left flex items-center justify-between"
              >
                <span>Contact</span>
                <ArrowRight size={15} className="text-slate-400" />
              </button>
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
                {user ? (
                  <>
                    <div className="flex items-center justify-between px-1 text-xs text-slate-600">
                      <span className="truncate max-w-[190px] font-medium">{user.email}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                        <Coins size={12} />
                        {typeof credits === 'number' ? `${credits} credits` : 'Credits'}
                      </span>
                    </div>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); onOpenWorkspace(); }}
                      className="w-full bg-crimson hover:bg-crimson/90 text-white text-[13px] font-semibold py-2.5 rounded-full transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>Go to Workspace</span>
                      <ArrowRight size={14} />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); onLogin(); }}
                      className="text-[14px] font-semibold text-slate-700 hover:text-crimson py-1 cursor-pointer"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); onLogin(); }}
                      className="bg-crimson text-white text-[13px] font-semibold px-4 py-2 rounded-full cursor-pointer shadow-sm"
                    >
                      Get Started Free
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. Hero & Main Interactive Section */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 flex-1 flex flex-col justify-center items-center text-center relative z-10 py-5 sm:py-6 lg:py-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-3xl mx-auto flex flex-col items-center"
        >
          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-slate-900 tracking-tight leading-[1.12] lg:leading-[1.08] mb-2.5 sm:mb-3">
            Writopedia AI Platform
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-[15px] md:text-[16px] lg:text-[17px] text-slate-600 font-normal max-w-[620px] mx-auto leading-relaxed sm:leading-snug mb-1.5 sm:mb-2 px-2">
            Create brand-consistent campaigns, presentations, images, videos, and marketing content from a single AI workspace.
          </p>

          {/* Helper Text */}
          <p className="text-[11px] sm:text-[11.5px] lg:text-[12px] text-slate-400 font-light max-w-lg mx-auto mb-3 sm:mb-3.5 lg:mb-4 px-2">
            Browse the platform, pricing and documentation before creating your workspace.
          </p>

          {/* Trust Badges: 2x2 Grid on Mobile, Single Row on Desktop (>=lg) */}
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-none mx-auto mb-2.5 sm:mb-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:flex lg:flex-row lg:flex-nowrap lg:justify-center lg:items-center lg:gap-3">
              {[
                "Brand AI Workspace",
                "Secure Payments",
                "Free Trial Available",
                "Enterprise Ready"
              ].map((pill, idx) => (
                <span 
                  key={idx} 
                  className="bg-white border border-slate-200/80 px-2.5 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-[12px] lg:text-[12.5px] font-semibold text-slate-700 flex items-center justify-center gap-1.5 sm:gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] h-[32px] sm:h-[34px] min-w-0"
                >
                  <Check size={14} className="text-crimson shrink-0" />
                  <span className="truncate">{pill}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Enterprise Proof Line */}
          <p className="text-[11.5px] sm:text-[12px] text-slate-400 font-light max-w-[600px] mx-auto leading-normal mb-4 sm:mb-5 lg:mb-6 px-3">
            Writopedia AI is an enterprise SaaS platform for AI-powered creative automation, trusted by businesses worldwide.
          </p>
        </motion.div>

        {/* 3. Main Command Grid: Responsive Hierarchy (Mobile Stack/2x2 -> Tablet Full CTA + 2x2 -> Desktop Asymmetric) */}
        <div className="w-full max-w-[800px] lg:max-w-[820px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-[18px] text-left">
          {/* Open Workspace Action Box (Crimson Gradient) */}
          <motion.div 
            whileHover={{ scale: 1.01, y: -2 }}
            className="lg:col-span-5 bg-gradient-to-br from-crimson to-[#b51034] rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between h-[165px] sm:h-[185px] lg:h-[238px] shadow-xl shadow-crimson/15 hover:shadow-crimson/25 transition-all duration-300 cursor-pointer"
            onClick={onOpenWorkspace}
            id="open-workspace-card"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <Rocket className="text-white w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 animate-pulse" />
            </div>

            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-2 text-white font-bold text-xl sm:text-2xl lg:text-[25px] tracking-tight">
                <span>Open Workspace</span>
                <ArrowRight size={20} className="lg:w-[22px] lg:h-[22px] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-white/85 font-light text-xs sm:text-[13px] lg:text-[14px]">
                Access your AI workspace
              </p>
            </div>
          </motion.div>

          {/* Sub Grid for Secondary Actions (2 x 2) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-[14px]">
            {/* Plans Card */}
            <motion.div 
              whileHover={{ y: -2 }}
              onClick={() => { if (navigateTo) { navigateTo('/pricing'); } else { setActiveModal('plans'); } }}
              className="bg-white border border-slate-200/70 rounded-2xl p-3.5 sm:p-4 lg:p-4.5 hover:shadow-sm hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[96px] sm:h-[106px] lg:h-[112px]"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-[12px] sm:text-[12.5px] uppercase tracking-wider">
                  <Tag size={15} className="lg:w-4 lg:h-4 text-slate-500" />
                  <span>Plans</span>
                </div>
                <p className="text-[11px] sm:text-[11.5px] lg:text-[12px] text-slate-500 font-light leading-snug">
                  Starter from ₹1,950/month
                </p>
              </div>
              <button 
                type="button"
                className="text-[11px] sm:text-[11.5px] font-bold text-crimson hover:text-crimson/80 transition-colors flex items-center gap-1 self-start cursor-pointer mt-1"
              >
                Compare Plans →
              </button>
            </motion.div>

            {/* Legal Card */}
            <motion.div 
              whileHover={{ y: -2 }}
              onClick={() => { if (navigateTo) { navigateTo('/legal'); } else { setLegalTab('privacy'); setActiveModal('legal'); } }}
              className="bg-white border border-slate-200/70 rounded-2xl p-3.5 sm:p-4 lg:p-4.5 hover:shadow-sm hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[96px] sm:h-[106px] lg:h-[112px]"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-[12px] sm:text-[12.5px] uppercase tracking-wider">
                  <Shield size={15} className="lg:w-4 lg:h-4 text-slate-500" />
                  <span>Legal</span>
                </div>
                <p className="text-[11px] sm:text-[11.5px] lg:text-[12px] text-slate-500 font-light leading-snug">
                  Privacy, Terms, Refund Policy
                </p>
              </div>
            </motion.div>

            {/* Contact Card */}
            <motion.div 
              whileHover={{ y: -2 }}
              onClick={openContactModal}
              className="bg-white border border-slate-200/70 rounded-2xl p-3.5 sm:p-4 lg:p-4.5 hover:shadow-sm hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[96px] sm:h-[106px] lg:h-[112px]"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-[12px] sm:text-[12.5px] uppercase tracking-wider">
                  <MessageSquare size={15} className="lg:w-4 lg:h-4 text-slate-500" />
                  <span>Contact</span>
                </div>
                <p className="text-[11px] sm:text-[11.5px] lg:text-[12px] text-slate-500 font-light leading-snug">
                  Enterprise support team
                </p>
              </div>
            </motion.div>

            {/* About Card */}
            <motion.div 
              whileHover={{ y: -2 }}
              onClick={() => window.open("https://writopedia.com", "_blank")}
              className="bg-white border border-slate-200/70 rounded-2xl p-3.5 sm:p-4 lg:p-4.5 hover:shadow-sm hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[96px] sm:h-[106px] lg:h-[112px]"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-[12px] sm:text-[12.5px] uppercase tracking-wider">
                  <Info size={15} className="lg:w-4 lg:h-4 text-slate-500" />
                  <span>About</span>
                </div>
                <p className="text-[11px] sm:text-[11.5px] lg:text-[12px] text-slate-500 font-light leading-snug">
                  Learn about Writopedia, our company, and policies.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* 4. Support Sub-footer (Compact & Responsive) */}
      <div className="shrink-0 border-t border-slate-200/50 bg-slate-50/60 py-3 sm:py-3.5 lg:py-2.5 text-center text-[11px] sm:text-[11.5px] text-slate-500 space-y-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row flex-wrap justify-center items-center gap-x-5 sm:gap-x-7 gap-y-1.5">
          <span className="font-medium text-slate-600">Need help choosing a plan?</span>
          <a href="mailto:business@writopedia.com" className="hover:text-crimson transition-colors flex items-center gap-1.5">
            <Mail size={13} className="shrink-0 text-slate-400" /> business@writopedia.com
          </a>
          <span className="flex items-center gap-1.5">
            <Phone size={13} className="shrink-0 text-slate-400" /> +91 84695 11803
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="shrink-0 text-slate-400" /> Monday-Friday • 10:00 AM - 6:00 PM IST
          </span>
        </div>
        <p className="max-w-[620px] mx-auto px-2 text-[10.5px] sm:text-[11px] text-slate-400 font-light leading-snug">
          Writopedia AI helps businesses generate AI-powered marketing assets, presentations, documents and campaigns while maintaining brand consistency.
        </p>
      </div>

      {/* 5. Primary Footer */}
      <footer className="shrink-0 border-t border-slate-100 bg-white py-3 sm:py-3.5 lg:py-2.5 px-4 sm:px-6 text-[11px] sm:text-[11.5px] text-slate-400 min-h-[48px] sm:h-[50px] flex items-center">
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3 text-center md:text-left">
          <span>© 2026 Writopedia AI</span>
          <span className="text-slate-500">business@writopedia.com</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1">
            <button onClick={() => { if (navigateTo) { navigateTo('/legal#privacy'); } else { setLegalTab('privacy'); setActiveModal('legal'); } }} className="hover:text-crimson transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => { if (navigateTo) { navigateTo('/legal#refund'); } else { setLegalTab('refund'); setActiveModal('legal'); } }} className="hover:text-crimson transition-colors cursor-pointer">Refund Policy</button>
            <button onClick={() => { if (navigateTo) { navigateTo('/legal#terms'); } else { setLegalTab('terms'); setActiveModal('legal'); } }} className="hover:text-crimson transition-colors cursor-pointer">Terms of Service</button>
            <button onClick={openContactModal} className="hover:text-crimson transition-colors cursor-pointer">Contact</button>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeContactModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-2xl w-[calc(100vw-24px)] sm:w-full max-w-2xl max-h-[calc(100dvh-32px)] lg:max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col z-10"
            >
              {/* Modal Header */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2">
                  {activeModal === 'plans' && <><Tag className="text-crimson shrink-0" size={18} /> <span>Subscription Plans</span></>}
                  {activeModal === 'legal' && <><Shield className="text-crimson shrink-0" size={18} /> <span>Legal Agreements & Rules</span></>}
                  {activeModal === 'contact' && <><MessageSquare className="text-crimson shrink-0" size={18} /> <span>Enterprise Support Line</span></>}
                  {activeModal === 'about' && <><Info className="text-crimson shrink-0" size={18} /> <span>Corporate Profile</span></>}
                  {activeModal === 'documentation' && <><Compass className="text-crimson shrink-0" size={18} /> <span>Platform Quickstart</span></>}
                </h3>
                <button 
                  onClick={closeContactModal}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content Scroll */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 sm:space-y-6 overscroll-contain">
                {/* 1. Plans */}
                {activeModal === 'plans' && (
                  <div className="space-y-6">
                    <p className="text-slate-500 font-light text-sm">
                      Select a flexible, high-capacity license to scale your brand expressions with professional quality.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Tier 1 */}
                      <div className="border border-slate-150 rounded-xl p-5 bg-slate-50/50 flex flex-col justify-between h-72">
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Starter</span>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-slate-900">₹1,950</div>
                            <div className="text-[10px] text-slate-400">per user / month</div>
                          </div>
                          <ul className="text-[11px] text-slate-500 space-y-2">
                            <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> 50 AI Credits</li>
                            <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> 1 Brand Profile</li>
                            <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Full HD Imagery</li>
                          </ul>
                        </div>
                        <button onClick={() => { setActiveModal(null); onLogin(); }} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] py-2 rounded-lg font-bold tracking-wider uppercase transition-colors cursor-pointer">Choose Starter</button>
                      </div>

                      {/* Tier 2 */}
                      <div className="border-2 border-crimson rounded-xl p-5 bg-white relative flex flex-col justify-between h-72 shadow-md shadow-crimson/5">
                        <div className="absolute top-0 right-6 -translate-y-1/2 bg-crimson text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Popular</div>
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-crimson uppercase tracking-widest">Professional</span>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-slate-900">₹4,950</div>
                            <div className="text-[10px] text-slate-400">per user / month</div>
                          </div>
                          <ul className="text-[11px] text-slate-500 space-y-2">
                            <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> 150 AI Credits</li>
                            <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Unlimited Brand Kits</li>
                            <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> 4K Image & Cinematic Video</li>
                            <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Human Touch Support</li>
                          </ul>
                        </div>
                        <button onClick={() => { setActiveModal(null); onLogin(); }} className="w-full bg-crimson hover:bg-crimson/95 text-white text-[10px] py-2 rounded-lg font-bold tracking-wider uppercase transition-colors cursor-pointer">Go Professional</button>
                      </div>

                      {/* Tier 3 */}
                      <div className="border border-slate-150 rounded-xl p-5 bg-slate-50/50 flex flex-col justify-between h-72">
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise</span>
                          <div className="space-y-1">
                            <div className="text-xl font-bold text-slate-900">Custom Rate</div>
                            <div className="text-[10px] text-slate-400">tailored SLA terms</div>
                          </div>
                          <ul className="text-[11px] text-slate-500 space-y-2">
                            <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Unlimited AI Quota</li>
                            <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Dedicated Account Lead</li>
                            <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Custom API Integrations</li>
                            <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Fine-tuned brand models</li>
                          </ul>
                        </div>
                        <button onClick={() => { setActiveModal(null); onLogin(); }} className="w-full bg-slate-150 hover:bg-slate-200 text-slate-700 text-[10px] py-2 rounded-lg font-bold tracking-wider uppercase transition-colors cursor-pointer">Talk to Sales</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Legal */}
                {activeModal === 'legal' && (
                  <div className="space-y-4">
                    <div className="flex border-b border-slate-100">
                      {[
                        { id: 'privacy', label: 'Privacy Policy' },
                        { id: 'terms', label: 'Terms of Service' },
                        { id: 'refund', label: 'Refund Policy' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setLegalTab(tab.id as any)}
                          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px cursor-pointer ${
                            legalTab === tab.id 
                              ? 'border-crimson text-crimson' 
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="text-slate-600 font-light text-xs leading-relaxed max-h-64 overflow-y-auto pr-2 space-y-4">
                      {legalTab === 'privacy' && (
                        <>
                          <p className="font-bold text-slate-800">1. Data Storage and Protection</p>
                          <p>Writopedia AI holds corporate security in absolute priority. Any brand asset, including logos, target keywords, custom text copy, or draft guidelines, are locked to your private user account using Supabase enterprise authentication and PostgreSQL Row Level Security (RLS).</p>
                          <p className="font-bold text-slate-800">2. AI Training Exclusions</p>
                          <p>We do not use customer data, uploaded logos, or generated templates to train public models. Your intellectual property is strictly protected.</p>
                        </>
                      )}
                      {legalTab === 'terms' && (
                        <>
                          <p className="font-bold text-slate-800">1. Usage Rights</p>
                          <p>All campaigns, slideshow presentations, generated vectors, and synthetic audio clips created on Writopedia belong entirely to the creative license holder. You have global distribution rights.</p>
                          <p className="font-bold text-slate-800">2. Prohibited Content</p>
                          <p>Users must not generate misinformation, deep-fakes, or abusive copy. Any breach of terms will lead to immediate account lock without refund.</p>
                        </>
                      )}
                      {legalTab === 'refund' && (
                        <>
                          <p className="font-bold text-slate-800">1. Credit Consumption and Refunds</p>
                          <p>We provide 50 free credits on sign-up so you can test all engines risk-free. Paid subscriptions come with a 7-day money-back guarantee if less than 15 credits have been used.</p>
                          <p className="font-bold text-slate-800">2. Curation Request Guarantee</p>
                          <p>If a human-touch refinement request fails to satisfy your target guidelines, credits will be refunded back to your balance immediately.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Contact Form */}
                {activeModal === 'contact' && (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    {contactSubmitted ? (
                      <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-800 p-6 rounded-xl text-center space-y-3">
                        <CheckCircle2 className="mx-auto w-10 h-10 text-emerald-500" />
                        <h4 className="font-bold text-base text-slate-900">Message Transmitted Successfully</h4>
                        <p className="text-xs text-slate-600 font-light max-w-sm mx-auto leading-relaxed">
                          Thank you! Your custom inquiry has been logged into our enterprise dispatch pipeline. Our onboarding specialists will follow up at <strong className="font-medium text-slate-800">{contactForm.email}</strong>.
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={closeContactModal}
                            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-500 font-light text-xs leading-relaxed">
                          Have specialized pipeline requirements? Complete the form below to reach our dedicated enterprise onboarding desk.
                        </p>

                        {contactError && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
                            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                            <span>{contactError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                            <input 
                              type="text" 
                              required 
                              disabled={isSubmittingContact}
                              value={contactForm.name}
                              onChange={(e) => {
                                setContactForm({ ...contactForm, name: e.target.value });
                                if (contactError) setContactError(null);
                              }}
                              placeholder="Jane Doe" 
                              className="w-full bg-slate-50 border border-slate-200 focus:border-crimson focus:bg-white p-2.5 rounded-lg text-xs outline-none transition-all disabled:opacity-50"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                            <input 
                              type="email" 
                              required 
                              disabled={isSubmittingContact}
                              value={contactForm.email}
                              onChange={(e) => {
                                setContactForm({ ...contactForm, email: e.target.value });
                                if (contactError) setContactError(null);
                              }}
                              placeholder="jane@yourcompany.com" 
                              className="w-full bg-slate-50 border border-slate-200 focus:border-crimson focus:bg-white p-2.5 rounded-lg text-xs outline-none transition-all disabled:opacity-50"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Detailed Requirements</label>
                          <textarea 
                            rows={3} 
                            required 
                            disabled={isSubmittingContact}
                            value={contactForm.message}
                            onChange={(e) => {
                              setContactForm({ ...contactForm, message: e.target.value });
                              if (contactError) setContactError(null);
                            }}
                            placeholder="Please outline your estimated campaign volume, custom model fine-tuning needs, or API throughput requirements." 
                            className="w-full bg-slate-50 border border-slate-200 focus:border-crimson focus:bg-white p-2.5 rounded-lg text-xs outline-none transition-all resize-none disabled:opacity-50"
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={isSubmittingContact}
                          className="w-full bg-crimson hover:bg-crimson/95 disabled:bg-crimson/60 text-white font-bold text-xs py-3 rounded-lg uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isSubmittingContact ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Sending Message...</span>
                            </>
                          ) : (
                            <span>Send Message</span>
                          )}
                        </button>
                      </>
                    )}
                  </form>
                )}

                {/* 4. About */}
                {activeModal === 'about' && (
                  <div className="space-y-4">
                    <p className="text-slate-600 font-light text-xs leading-relaxed">
                      Writopedia AI leads creative workflow transformation by orchestrating unified brand voices across text, image, audio, and cinematic sequences.
                    </p>
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-3">
                        <Briefcase className="text-crimson shrink-0" size={18} />
                        <div>
                          <p className="font-bold text-xs text-slate-800">Enterprise AI Infrastructure</p>
                          <p className="text-[10px] text-slate-400">Harnessing custom generative foundation models to deploy dynamic brand assets safely.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Lock className="text-crimson shrink-0" size={18} />
                        <div>
                          <p className="font-bold text-xs text-slate-800">Data-Compliance Standard</p>
                          <p className="text-[10px] text-slate-400">Locked sandboxes hosting safe curation, translation, and media editing suites.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Documentation */}
                {activeModal === 'documentation' && (
                  <div className="space-y-4">
                    <p className="text-slate-600 font-light text-xs leading-relaxed">
                      Welcome to the Enterprise Creative Suite. Build a coherent, high-impact presence in minutes:
                    </p>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-crimson/10 text-crimson flex items-center justify-center text-xs font-bold shrink-0">1</div>
                        <div>
                          <p className="font-bold text-xs text-slate-800">Deploy Brand Identity</p>
                          <p className="text-[11px] text-slate-400">Scan your website URL or write a brief to generate coordinated hex themes, logo assets, and custom pillars.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-crimson/10 text-crimson flex items-center justify-center text-xs font-bold shrink-0">2</div>
                        <div>
                          <p className="font-bold text-xs text-slate-800">Launch Creative Gems</p>
                          <p className="text-[11px] text-slate-400">Leverage specialized pipelines like photorealistic imaging, text copy writing, interactive audio readouts, and cinematic sequences.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-crimson/10 text-crimson flex items-center justify-center text-xs font-bold shrink-0">3</div>
                        <div>
                          <p className="font-bold text-xs text-slate-800">Human Refinement</p>
                          <p className="text-[11px] text-slate-400">Submit requests directly to specialized human designers when complex layouts or custom editing are required.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
