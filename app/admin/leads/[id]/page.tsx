"use server";

import { getCrmLeadDetail, updateCrmLeadStatus, updateCrmLeadNotes, assignCrmLead } from "app/admin/crm-actions";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getCrmLeadDetail(id);

  if (!result) notFound();

  const { lead, timeline } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/leads" className="mb-2 inline-block text-xs text-gold-400 hover:underline">
            &larr; Back to leads
          </Link>
          <h1 className="text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
            {lead.name || "Anonymous Lead"}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {lead.email || ""} {lead.phone ? `| ${lead.phone}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            lead.lead_temperature === "HOT" ? "bg-red-500/20 text-red-400" :
            lead.lead_temperature === "WARM" ? "bg-amber-500/20 text-amber-400" :
            "bg-neutral-500/20 text-neutral-400"
          }`}>
            {lead.lead_temperature} — Score {lead.lead_score}
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            lead.status === "CONVERTED" ? "bg-emerald-500/20 text-emerald-400" :
            lead.status === "QUALIFIED" ? "bg-green-500/20 text-green-400" :
            lead.status === "CONTACTED" ? "bg-blue-500/20 text-blue-400" :
            "bg-indigo-500/20 text-indigo-400"
          }`}>
            {lead.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lead Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <h2 className="mb-4 text-sm font-medium text-neutral-300">Contact Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-neutral-500">Name</dt>
                <dd className="mt-1 text-white">{lead.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Email</dt>
                <dd className="mt-1 text-white">{lead.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Phone</dt>
                <dd className="mt-1 text-white">{lead.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">WhatsApp</dt>
                <dd className="mt-1 text-white">{lead.whatsapp || "—"}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Source</dt>
                <dd className="mt-1 text-white">{lead.source}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Intent</dt>
                <dd className="mt-1 text-white">{lead.intent}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">First Seen</dt>
                <dd className="mt-1 text-white">{new Date(lead.first_seen_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Last Activity</dt>
                <dd className="mt-1 text-white">{new Date(lead.last_activity_at).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <h2 className="mb-4 text-sm font-medium text-neutral-300">Activity Timeline</h2>
            {timeline.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-600">No events recorded yet</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((entry: { time: string; event: string; detail: string; score_delta: number }, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-gold-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{entry.event.replace(/_/g, " ")}</span>
                        <span className="text-xs text-neutral-500">
                          {new Date(entry.time).toLocaleTimeString()}
                        </span>
                      </div>
                      {entry.score_delta !== 0 && (
                        <span className={`text-xs ${entry.score_delta > 0 ? "text-green-400" : "text-red-400"}`}>
                          {entry.score_delta > 0 ? "+" : ""}{entry.score_delta} pts
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <h2 className="mb-4 text-sm font-medium text-neutral-300">Quick Actions</h2>
            <div className="space-y-2">
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="block w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-center text-sm text-white hover:border-gold-400"
                >
                  Call Phone
                </a>
              )}
              {lead.whatsapp && (
                <a
                  href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-2.5 text-center text-sm text-green-400 hover:border-green-500"
                >
                  WhatsApp
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="block w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-center text-sm text-white hover:border-gold-400"
                >
                  Send Email
                </a>
              )}
            </div>
          </div>

          {/* Catering Details */}
          {lead.intent === "CATERING" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
              <h2 className="mb-4 text-sm font-medium text-amber-400">Catering Details</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-neutral-500">Event Type</dt>
                  <dd className="text-white">{lead.catering_event_type || "—"}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Guest Count</dt>
                  <dd className="text-white">{lead.catering_guest_count || "—"}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Location</dt>
                  <dd className="text-white">{lead.catering_location || "—"}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Budget</dt>
                  <dd className="text-white">
                    {lead.catering_budget ? `KES ${lead.catering_budget.toLocaleString()}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Event Date</dt>
                  <dd className="text-white">
                    {lead.catering_event_date ? new Date(lead.catering_event_date).toLocaleDateString() : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Notes */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <h2 className="mb-4 text-sm font-medium text-neutral-300">Notes</h2>
            <p className="text-sm text-neutral-400">{lead.notes || "No notes"}</p>
          </div>

          {/* Consent */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <h2 className="mb-4 text-sm font-medium text-neutral-300">Consent</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Marketing</span>
                <span className={lead.consent_marketing ? "text-green-400" : "text-red-400"}>
                  {lead.consent_marketing ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">WhatsApp</span>
                <span className={lead.consent_whatsapp ? "text-green-400" : "text-red-400"}>
                  {lead.consent_whatsapp ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Email</span>
                <span className={lead.consent_email ? "text-green-400" : "text-red-400"}>
                  {lead.consent_email ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
