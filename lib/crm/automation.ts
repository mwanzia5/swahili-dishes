import { getAdminClient } from "lib/insforge/admin";
import type { AutomationRule, AutomationRun } from "./types";

export async function getActiveRules(): Promise<AutomationRule[]> {
  const admin = getAdminClient();
  const { data } = await admin.database
    .from("automation_rules").select("*")
    .eq("is_active", true);
  return (data as AutomationRule[]) || [];
}

export async function getRulesByTrigger(eventType: string): Promise<AutomationRule[]> {
  const admin = getAdminClient();
  const { data } = await admin.database
    .from("automation_rules").select("*")
    .eq("trigger_event", eventType)
    .eq("is_active", true);
  return (data as AutomationRule[]) || [];
}

export async function createAutomationRun(params: {
  rule_id: string;
  lead_id?: string;
  trigger_event: string;
}): Promise<AutomationRun | null> {
  const admin = getAdminClient();
  const { data, error } = await admin.database
    .from("automation_runs")
    .insert({
      rule_id: params.rule_id,
      lead_id: params.lead_id || null,
      trigger_event: params.trigger_event,
      status: "PENDING",
    })
    .select().single();

  if (error) { console.error("createAutomationRun error:", error); return null; }
  return data as AutomationRun;
}

export async function updateAutomationRun(
  runId: string,
  status: AutomationRun["status"],
  result?: Record<string, unknown>,
  error?: string
): Promise<void> {
  const admin = getAdminClient();
  const updates: Record<string, unknown> = { status };
  if (result) updates.result = result;
  if (error) updates.error = error;
  if (status === "SUCCESS" || status === "FAILED" || status === "CANCELLED") {
    updates.completed_at = new Date().toISOString();
  }

  await admin.database.from("automation_runs").update(updates).eq("id", runId);
}

export async function incrementRuleExecution(ruleId: string): Promise<void> {
  const admin = getAdminClient();
  try {
    await admin.database.rpc("increment_rule_execution" as any, { p_rule_id: ruleId });
  } catch {
    // Fallback: direct update
    await admin.database.from("automation_rules").update({
      execution_count: 0,
      last_executed_at: new Date().toISOString(),
    }).eq("id", ruleId);
  }
}

export async function processEvent(
  eventType: string,
  leadId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const rules = await getRulesByTrigger(eventType);

  for (const rule of rules) {
    // Check conditions
    if (!checkConditions(rule.conditions, metadata || {})) continue;

    const run = await createAutomationRun({
      rule_id: rule.id,
      lead_id: leadId,
      trigger_event: eventType,
    });

    if (!run) continue;

    try {
      await executeActions(rule.actions, leadId, metadata || {});
      await updateAutomationRun(run.id, "SUCCESS");
    } catch (e: any) {
      await updateAutomationRun(run.id, "FAILED", {}, e.message);
    }
  }
}

function checkConditions(conditions: Record<string, unknown>, metadata: Record<string, unknown>): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const [key, value] of Object.entries(conditions)) {
    if (key === "lead_has_whatsapp_consent") {
      // Would check lead consent - simplified
      continue;
    }
    if (key === "min_cart_value") {
      const cartValue = Number(metadata.cart_value || 0);
      if (cartValue < Number(value)) return false;
    }
    if (key === "lead_temperature") {
      // Would check lead temperature
      continue;
    }
  }
  return true;
}

async function executeActions(
  actions: Array<{ type: string; params: Record<string, unknown> }>,
  leadId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case "NOTIFY_ADMIN":
        // Log notification for admin
        console.log(`[CRM Automation] Admin notification for lead ${leadId}:`, action.params);
        break;
      case "UPDATE_LEAD": {
        const admin = getAdminClient();
        await admin.database.from("leads").update(action.params).eq("id", leadId);
        break;
      }
      case "CREATE_OPPORTUNITY": {
        const admin = getAdminClient();
        await admin.database.from("opportunities").insert({
          lead_id: leadId,
          ...action.params,
        });
        break;
      }
      case "SEND_WHATSAPP":
      case "SEND_EMAIL":
        // Queue message for later sending
        const admin = getAdminClient();
        await admin.database.from("message_logs").insert({
          lead_id: leadId,
          channel: action.type === "SEND_WHATSAPP" ? "whatsapp" : "email",
          template: action.params.template,
          body: action.params.body,
          status: "QUEUED",
        });
        break;
      default:
        console.warn(`[CRM Automation] Unknown action type: ${action.type}`);
    }
  }
}
