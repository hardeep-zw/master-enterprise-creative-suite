import React, { useEffect, useState } from 'react';
import { 
  fetchAdminHealth, 
  type AdminHealthData 
} from '@web/infrastructure/repositories/adminRepository.js';
import { 
  Settings, 
  ShieldCheck, 
  Activity, 
  Server, 
  Database, 
  Mail, 
  HardDrive, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Info,
  Lock,
  User
} from 'lucide-react';
import { cn } from '@web/lib/utils.js';

interface SettingsSectionProps {
  user: any;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ user }) => {
  const [health, setHealth] = useState<AdminHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminHealth();
      setHealth(data);
    } catch (err: any) {
      console.error('Failed to load system health:', err);
      setError(err?.message || 'Failed to query service status probes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const formatUptime = (seconds?: number) => {
    if (!seconds && seconds !== 0) return '—';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const getServiceStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Operational
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" />
            Degraded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
            {status || 'Unavailable'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-rose-500" />
            Admin Operations Settings & Health
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Operator profile context, platform health probes, and architectural scope governance.
          </p>
        </div>
        <button
          onClick={() => loadHealth(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin text-rose-400')} />
          Run Health Probes
        </button>
      </div>

      {/* Admin Profile Context */}
      <div className="rounded border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-200">Operator Identity</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Administrator
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs font-mono">
          <div className="p-3 rounded bg-slate-950/50 border border-slate-800/80">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Signed-in Account</span>
            <span className="text-slate-200 font-medium break-all">{user?.email || 'Authenticated Operator'}</span>
          </div>
          <div className="p-3 rounded bg-slate-950/50 border border-slate-800/80">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Account Identifier</span>
            <span className="text-slate-400 break-all">{user?.uid || '—'}</span>
          </div>
          <div className="p-3 rounded bg-slate-950/50 border border-slate-800/80">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Access Level</span>
            <span className="text-emerald-400 font-medium">Operations Console (Full Audit & Curation)</span>
          </div>
        </div>
      </div>

      {/* System Health Probes */}
      <div className="rounded border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-200">Core Service Health Probes</h2>
          </div>
          {health && (
            <span className="text-[11px] font-mono text-slate-400">
              Server Uptime: <strong className="text-slate-200">{formatUptime(health.uptimeSeconds)}</strong>
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-20 rounded bg-slate-950/50 border border-slate-800/60 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded bg-rose-950/20 border border-rose-900/30 text-xs text-rose-300 font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        ) : health ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-xs font-medium text-slate-200">API Gateway</div>
                    <div className="text-[10px] text-slate-500 font-mono">Node.js Express</div>
                  </div>
                </div>
                {getServiceStatusBadge(health.services.api)}
              </div>

              <div className="p-3.5 rounded bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-xs font-medium text-slate-200">PostgreSQL DB</div>
                    <div className="text-[10px] text-slate-500 font-mono">Supabase Auth & Tables</div>
                  </div>
                </div>
                {getServiceStatusBadge(health.services.database)}
              </div>

              <div className="p-3.5 rounded bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-xs font-medium text-slate-200">Object Storage</div>
                    <div className="text-[10px] text-slate-500 font-mono">Supabase Buckets</div>
                  </div>
                </div>
                {getServiceStatusBadge(health.services.storage)}
              </div>

              <div className="p-3.5 rounded bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-xs font-medium text-slate-200">Email System</div>
                    <div className="text-[10px] text-slate-500 font-mono">Resend API Service</div>
                  </div>
                </div>
                {getServiceStatusBadge(health.services.email)}
              </div>
            </div>

            {/* Email Outbound Configuration Notice */}
            <div className="p-3.5 rounded bg-slate-950/30 border border-slate-800/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-400 text-[11px]">
                  Configured Outbound Sender: <strong className="text-slate-200">{health.emailConfig.fromEmail}</strong>
                </span>
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  Env: {health.environment}
                </span>
              </div>
              {health.emailConfig.isTestDomain && (
                <div className="p-2 rounded bg-amber-500/5 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Resend Sandbox Domain:</strong> In development/test mode, outbound notifications to unverified external emails are redirected by Resend to verified account mailboxes to ensure safe delivery without spam strikes.
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Scope Governance Rules */}
      <div className="rounded border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-500" />
          <h2 className="text-sm font-semibold text-slate-200">Architecture Governance & Scope Isolation</h2>
        </div>
        <p className="text-slate-400">
          This console is strictly designated for internal operations. Customer-facing creative workflows and balance modification tools are separated by design:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded bg-slate-950/50 border border-slate-800/60 text-slate-300 space-y-1">
            <div className="font-mono font-medium text-slate-200 text-[11px]">Brand Guidelines & Init</div>
            <p className="text-slate-400 text-[11px]">
              Managed solely by authenticated workspace owners via customer settings and onboarding.
            </p>
          </div>
          <div className="p-3 rounded bg-slate-950/50 border border-slate-800/60 text-slate-300 space-y-1">
            <div className="font-mono font-medium text-slate-200 text-[11px]">Creative Generation Gems</div>
            <p className="text-slate-400 text-[11px]">
              Available exclusively in customer creative studio to preserve multi-tenant context.
            </p>
          </div>
          <div className="p-3 rounded bg-slate-950/50 border border-slate-800/60 text-slate-300 space-y-1">
            <div className="font-mono font-medium text-slate-200 text-[11px]">Credit Ledger Mutation</div>
            <p className="text-slate-400 text-[11px]">
              Credit awards are issued authoritatively via Razorpay webhooks, preventing ad-hoc balance tampering.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
