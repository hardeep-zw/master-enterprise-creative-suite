import React, { useEffect, useState } from 'react';
import { 
  OverviewSection 
} from '../components/OverviewSection.js';
import { 
  CurationSection 
} from '../components/CurationSection.js';
import { 
  PaymentsSection 
} from '../components/PaymentsSection.js';
import { 
  ActivitySection 
} from '../components/ActivitySection.js';
import { 
  SettingsSection 
} from '../components/SettingsSection.js';
import { 
  fetchAdminOverview 
} from '@web/infrastructure/repositories/adminRepository.js';
import { 
  LayoutDashboard, 
  Sparkles, 
  CreditCard, 
  Activity, 
  Settings, 
  ArrowLeft, 
  Menu, 
  X, 
  ShieldCheck,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { cn } from '@web/lib/utils.js';

export type AdminSection = 'overview' | 'curation' | 'payments' | 'logs' | 'settings';

interface AdminConsoleProps {
  currentPath: string;
  navigateTo: (path: string, options?: { replace?: boolean }) => void;
  user: any;
  onLogout: () => Promise<void>;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentPath,
  navigateTo,
  user,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Derive active section from URL path
  const getActiveSection = (): AdminSection => {
    if (currentPath.includes('/admin/curation')) return 'curation';
    if (currentPath.includes('/admin/payments')) return 'payments';
    if (currentPath.includes('/admin/logs') || currentPath.includes('/admin/activity')) return 'logs';
    if (currentPath.includes('/admin/settings')) return 'settings';
    return 'overview';
  };

  const activeSection = getActiveSection();

  // Load pending count for Curation nav badge
  useEffect(() => {
    let isMounted = true;
    fetchAdminOverview()
      .then((data) => {
        if (isMounted && data?.curation?.pendingCount !== undefined) {
          setPendingCount(data.curation.pendingCount);
        }
      })
      .catch(() => {});

    // Periodic poll every 30s for pending curation badge
    const interval = setInterval(() => {
      fetchAdminOverview()
        .then((data) => {
          if (isMounted && data?.curation?.pendingCount !== undefined) {
            setPendingCount(data.curation.pendingCount);
          }
        })
        .catch(() => {});
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleNavClick = (section: AdminSection) => {
    setMobileMenuOpen(false);
    switch (section) {
      case 'curation':
        navigateTo('/admin/curation');
        break;
      case 'payments':
        navigateTo('/admin/payments');
        break;
      case 'logs':
        navigateTo('/admin/logs');
        break;
      case 'settings':
        navigateTo('/admin/settings');
        break;
      case 'overview':
      default:
        navigateTo('/admin');
        break;
    }
  };

  const navItems: Array<{
    id: AdminSection;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      id: 'curation',
      label: 'Curation',
      icon: <Sparkles className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-4 h-4" />
    },
    {
      id: 'logs',
      label: 'Activity / Logs',
      icon: <Activity className="w-4 h-4" />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased selection:bg-rose-500/20 selection:text-rose-200">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-500/30" />
            <span className="font-bold tracking-tight text-sm text-slate-100">
              Writopedia <span className="text-slate-400 font-mono font-normal text-xs uppercase ml-1">Admin Operations</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Admin Session:</span>
            <span className="text-slate-200 font-semibold">{user?.email || 'Authorized'}</span>
          </div>

          <button
            onClick={() => navigateTo('/workspace')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Studio</span>
          </button>
        </div>
      </header>

      {/* Main Console Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation (Desktop) */}
        <aside className="w-60 border-r border-slate-800/80 bg-[#090d16]/95 hidden md:flex flex-col justify-between shrink-0 p-4">
          <div className="space-y-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold px-2 mb-2">
                Operations Console
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition group',
                        isActive
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={cn(isActive ? 'text-rose-400' : 'text-slate-500 group-hover:text-slate-300')}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold bg-amber-500 text-slate-950">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Scope Guard Callout */}
            <div className="p-3 rounded bg-slate-900/50 border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
              <div className="font-mono text-slate-300 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                Scope Enforced
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Brand onboarding, customer credit editors, and creative studio tools remain outside this internal operations console.
              </p>
            </div>
          </div>

          {/* Footer User Profile & Logout */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="px-2 py-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Operator</div>
              <div className="text-xs font-mono text-slate-300 truncate" title={user?.email || ''}>
                {user?.email || 'Admin'}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-slate-400 hover:text-rose-400 hover:bg-slate-900/60 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden bg-black/70 backdrop-blur-sm">
            <div className="w-64 bg-[#090d16] border-r border-slate-800 h-full p-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-sm text-slate-100">Operations Console</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition',
                          isActive
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold bg-amber-500 text-slate-950">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo('/workspace');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-slate-300 hover:bg-slate-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Studio</span>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-rose-400 hover:bg-slate-900 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {activeSection === 'overview' && (
              <OverviewSection onNavigateToSection={(s) => handleNavClick(s as AdminSection)} />
            )}
            {activeSection === 'curation' && (
              <CurationSection />
            )}
            {activeSection === 'payments' && (
              <PaymentsSection />
            )}
            {activeSection === 'logs' && (
              <ActivitySection />
            )}
            {activeSection === 'settings' && (
              <SettingsSection user={user} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
