import { getAdminClient } from "lib/insforge/admin";
import type { LeadScoringRule } from "./types";

export async function getScoringRules(): Promise<LeadScoringRule[]> {
  const admin = getAdminClient();
  const { data } = await admin.database
    .from("lead_scoring_rules").select("*").order("score_value", { ascending: false });
  return (data as LeadScoringRule[]) || [];
}

export async function updateScoringRule(ruleId: string, scoreValue: number): Promise<boolean> {
  const admin = getAdminClient();
  const { error } = await admin.database
    .from("lead_scoring_rules")
    .update({ score_value: scoreValue, updated_at: new Date().toISOString() })
    .eq("id", ruleId);
  return !error;
}

export async function toggleScoringRule(ruleId: string, isActive: boolean): Promise<boolean> {
  const admin = getAdminClient();
  const { error } = await admin.database
    .from("lead_scoring_rules")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", ruleId);
  return !error;
}

export async function getTemperatureThresholds(): Promise<{ warm: number; hot: number }> {
  // Defaults: 21 = WARM, 51 = HOT
  return { warm: 21, hot: 51 };
}
