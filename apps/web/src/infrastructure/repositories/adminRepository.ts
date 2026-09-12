/**
 * Admin Console Operations Repository.
 * Backed authoritatively by Supabase PostgreSQL tables via /api/admin and /api/human-touch.
 */

import { apiClient } from '../api/apiClient.js';
import type { PromptEngineSettings } from '@shared-types/creative.js';

export interface AdminOverviewData {
  curation: {
    pendingCount: number;
    inReviewCount: number;
    completedTodayCount: number;
    totalCompletedCount: number;
    rejectedCount: number;
  };
  payments: {
    capturedCount: number;
    createdCount: number;
    failedCount: number;
    totalAmountSubunits: number;
  };
  system: {
    dbStatus: string;
    resendConfigured: boolean;
    serverTime: string;
    nodeEnv: string;
  };
}

export interface AdminPaymentItem {
  id: string;
  orderId: string;
  paymentId?: string;
  planId: string;
  amountSubunits: number;
  currency: string;
  status: string;
  createdAt: string;
  userEmail?: string;
  isSimulated?: boolean;
}

export interface AdminActivityItem {
  id: string;
  category: 'curation' | 'payment' | 'system';
  actor: string;
  action: string;
  resourceId: string;
  status: string;
  timestamp: string;
  details?: string;
}

export interface AdminHealthData {
  services: {
    api: string;
    database: string;
    storage: string;
    email: string;
  };
  emailConfig: {
    fromEmail: string;
    isTestDomain: boolean;
  };
  environment: string;
  uptimeSeconds: number;
}

export async function fetchAdminOverview(): Promise<AdminOverviewData> {
  const res = await apiClient.get<{ success: boolean; curation: any; payments: any; system: any }>('/api/admin/overview');
  return {
    curation: res.curation,
    payments: res.payments,
    system: res.system,
  };
}

export async function fetchAdminPayments(status?: string, limit: number = 50): Promise<{ payments: AdminPaymentItem[]; metrics: any }> {
  const query = status && status !== 'all' ? `?status=${status}&limit=${limit}` : `?limit=${limit}`;
  const res = await apiClient.get<{ success: boolean; payments: AdminPaymentItem[]; metrics: any }>(`/api/admin/payments${query}`);
  return {
    payments: res.payments || [],
    metrics: res.metrics,
  };
}

export async function fetchAdminActivity(category?: string, limit: number = 40): Promise<AdminActivityItem[]> {
  const query = category && category !== 'all' ? `?category=${category}&limit=${limit}` : `?limit=${limit}`;
  const res = await apiClient.get<{ success: boolean; events: AdminActivityItem[] }>(`/api/admin/activity${query}`);
  return res.events || [];
}

export async function fetchAdminHealth(): Promise<AdminHealthData> {
  return apiClient.get<AdminHealthData>('/api/admin/health');
}

export async function retryCurationNotification(requestId: string): Promise<any> {
  return apiClient.post(`/api/human-touch/${requestId}/notify-retry`, {});
}

export function subscribeAdminSettings(
  docId: string = 'default',
  onData: (settings: PromptEngineSettings | null) => void,
  onError?: (err: any) => void
): () => void {
  let isCancelled = false;

  apiClient.get<{ success: boolean; value: PromptEngineSettings | null }>(`/api/admin/settings/${docId}`)
    .then((res) => {
      if (!isCancelled && res?.value) {
        onData(res.value);
      }
    })
    .catch((err) => {
      console.warn('[AdminRepository] Supabase fetch error:', err.message);
      if (onError) onError(err);
    });

  return () => {
    isCancelled = true;
  };
}

export async function saveAdminSettings(
  settings: PromptEngineSettings,
  docId: string = 'default'
): Promise<void> {
  try {
    await apiClient.put(`/api/admin/settings/${docId}`, { value: settings });
  } catch (err) {
    console.warn('[AdminRepository] API save error:', err);
  }
}
