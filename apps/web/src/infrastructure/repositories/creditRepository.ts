/**
 * Credit & Ledger Repository.
 * Connects authoritatively to the backend credit ledger API backed by Supabase PostgreSQL (public.credit_ledger).
 */

import { apiClient } from '../api/apiClient.js';

export interface CreditLedgerTransaction {
  id: string;
  workspaceId: string;
  actorUserId: string;
  amount: number;
  resultingBalance: number;
  type: string;
  referenceId?: string | null;
  idempotencyKey?: string | null;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface FetchCreditLedgerResponse {
  success: boolean;
  workspaceId?: string;
  transactions?: any[];
  error?: string;
}

/**
 * Fetches recent credit ledger transactions for the authenticated user's workspace.
 */
export async function fetchCreditLedger(limit: number = 50): Promise<CreditLedgerTransaction[]> {
  try {
    const res = await apiClient.get<FetchCreditLedgerResponse>(`/api/payment/ledger?limit=${limit}`);
    if (res?.success && Array.isArray(res.transactions)) {
      return res.transactions.map((row) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        actorUserId: row.actor_user_id,
        amount: Number(row.amount),
        resultingBalance: Number(row.resulting_balance ?? 0),
        type: row.type || 'credit_event',
        referenceId: row.reference_id,
        idempotencyKey: row.idempotency_key,
        description: row.description || 'Credit Adjustment',
        metadata: row.metadata || {},
        createdAt: row.created_at || new Date().toISOString()
      }));
    }
    return [];
  } catch (err: any) {
    console.warn('[CreditRepository] Failed to fetch credit ledger:', err?.message || err);
    throw err;
  }
}
