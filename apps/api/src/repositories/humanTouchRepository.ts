/**
 * Human Touch Curation Request Repository.
 * Direct persistence interface to public.human_touch_requests.
 */

import { getSupabaseAdmin } from "../infrastructure/supabase/supabaseClient.js";

export interface HumanTouchInput {
  workspaceId: string;
  requesterId: string;
  assetType: string;
  storageBucket?: string;
  storagePath: string;
  originalPrompt: string;
  modelsUsed?: string;
  userComment: string;
  emailReceipt: string;
}

export interface HumanTouchRecord extends HumanTouchInput {
  id: string;
  status: "pending" | "in_review" | "completed" | "rejected";
  assignedCuratorId?: string;
  completedStoragePath?: string;
  completedComment?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

function mapRowToRecord(d: any): HumanTouchRecord {
  return {
    id: d.id,
    workspaceId: d.workspace_id,
    requesterId: d.requester_id,
    assetType: d.asset_type,
    storageBucket: d.storage_bucket,
    storagePath: d.storage_path,
    originalPrompt: d.original_prompt,
    modelsUsed: d.models_used,
    userComment: d.user_comment,
    emailReceipt: d.email_receipt,
    status: d.status,
    assignedCuratorId: d.assigned_curator_id,
    completedStoragePath: d.completed_storage_path,
    completedComment: d.completed_comment,
    completedAt: d.completed_at,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

export class HumanTouchRepository {
  async createRequest(req: HumanTouchInput): Promise<HumanTouchRecord | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("human_touch_requests")
      .insert({
        workspace_id: req.workspaceId,
        requester_id: req.requesterId,
        asset_type: req.assetType,
        storage_bucket: req.storageBucket || "user-assets",
        storage_path: req.storagePath,
        original_prompt: req.originalPrompt,
        models_used: req.modelsUsed || "",
        user_comment: req.userComment,
        email_receipt: req.emailReceipt,
        status: "pending",
      })
      .select()
      .single();

    if (error || !data) {
      console.error("HumanTouchRepository.createRequest error:", error);
      return null;
    }

    return mapRowToRecord(data);
  }

  async getById(id: string): Promise<HumanTouchRecord | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("human_touch_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("HumanTouchRepository.getById error:", error);
      return null;
    }

    return mapRowToRecord(data);
  }

  async updateStatus(
    id: string,
    updates: {
      status: "pending" | "in_review" | "completed" | "rejected";
      completedStoragePath?: string;
      completedComment?: string;
      assignedCuratorId?: string;
    }
  ): Promise<HumanTouchRecord | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const payload: any = {
      status: updates.status,
      updated_at: new Date().toISOString(),
    };

    if (updates.completedStoragePath !== undefined) {
      payload.completed_storage_path = updates.completedStoragePath;
    }
    if (updates.completedComment !== undefined) {
      payload.completed_comment = updates.completedComment;
    }
    if (updates.assignedCuratorId !== undefined) {
      payload.assigned_curator_id = updates.assignedCuratorId;
    }
    if (updates.status === "completed") {
      payload.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("human_touch_requests")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("HumanTouchRepository.updateStatus error:", error);
      return null;
    }

    return mapRowToRecord(data);
  }

  async cancelRequest(id: string, requesterId: string): Promise<HumanTouchRecord | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    // Only allow cancellation if currently pending and belongs to requester
    const { data, error } = await supabase
      .from("human_touch_requests")
      .update({
        status: "rejected",
        completed_comment: "Cancelled by client request",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("requester_id", requesterId)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (error || !data) {
      console.error("HumanTouchRepository.cancelRequest error:", error);
      return null;
    }

    return mapRowToRecord(data);
  }

  async listByWorkspace(workspaceId: string, limit = 50): Promise<HumanTouchRecord[]> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("human_touch_requests")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error("HumanTouchRepository.listByWorkspace error:", error);
      return [];
    }

    return data.map(mapRowToRecord);
  }

  async listAll(limit = 100): Promise<HumanTouchRecord[]> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("human_touch_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error("HumanTouchRepository.listAll error:", error);
      return [];
    }

    return data.map(mapRowToRecord);
  }

  async getMetrics(): Promise<{
    pendingCount: number;
    inReviewCount: number;
    completedTodayCount: number;
    totalCompletedCount: number;
    rejectedCount: number;
  }> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { pendingCount: 0, inReviewCount: 0, completedTodayCount: 0, totalCompletedCount: 0, rejectedCount: 0 };
    }

    const { data, error } = await supabase
      .from("human_touch_requests")
      .select("status, completed_at");

    if (error || !data) {
      return { pendingCount: 0, inReviewCount: 0, completedTodayCount: 0, totalCompletedCount: 0, rejectedCount: 0 };
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    let pendingCount = 0;
    let inReviewCount = 0;
    let completedTodayCount = 0;
    let totalCompletedCount = 0;
    let rejectedCount = 0;

    for (const row of data) {
      if (row.status === "pending") pendingCount++;
      else if (row.status === "in_review") inReviewCount++;
      else if (row.status === "completed") {
        totalCompletedCount++;
        if (row.completed_at && new Date(row.completed_at) >= todayStart) {
          completedTodayCount++;
        }
      } else if (row.status === "rejected") {
        rejectedCount++;
      }
    }

    return { pendingCount, inReviewCount, completedTodayCount, totalCompletedCount, rejectedCount };
  }
}

export const humanTouchRepository = new HumanTouchRepository();
