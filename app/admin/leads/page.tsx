"use server";

import { getCrmDashboardStats, getCrmLeads, getCrmRecentEvents, getCrmEventStats } from "app/admin/crm-actions";

export default async function AdminLeadsPage() {
  const [stats, leadsResult, recentEvents, eventStats] = await Promise.all([
    getCrmDashboardStats(),
    getCrmLeads({ limit: 20 }),
    getCrmRecentEvents(),
    getCrmEventStats(),
  ]);

  if (!stats) {
    return (
      <div className="p-8 text-center text-neutral-500">
        <p>Access denied. Admin only.</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Leads", value: stats.total_leads, color: "text-white" },
    { label: "New Leads", value: stats.new_leads, color: "text-blue-400" },
    { label: "Hot Leads", value: stats.hot_leads, color: "text-red-400" },
    { label: "Warm Leads", value: stats.warm_leads, color: "text-amber-400" },
    { label: "Qualified", value: stats.qualified_leads, color: "text-green-400" },
    { label: "Converted", value: stats.converted_leads, color: "text-emerald-400" },
    { label: "Conversion Rate", value: `${stats.conversion_rate.toFixed(1)}%`, color: "text-gold-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Leads & CRM
        </h1>
        <p className="mt-1 text-sm text-neutral-400">Track and manage your customer leads</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Source Breakdown */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <h2 className="mb-4 text-sm font-medium text-neutral-300">Lead Sources</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(stats.source_breakdown)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([source, count]) => (
              <div key={source} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
                <span className="text-sm text-neutral-400">{source}</span>
                <span className="text-sm font-medium text-white">{count}</span>
              </div>
            ))}
          {Object.keys(stats.source_breakdown).length === 0 && (
            <p className="col-span-full text-sm text-neutral-600">No lead data yet</p>
          )}
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-300">Recent Leads</h2>
          <a href="/admin/leads" className="text-xs text-gold-400 hover:underline">View all</a>
        </div>
        {leadsResult.leads.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-600">
            No leads yet. Leads will appear as visitors interact with your site.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-xs text-neutral-500">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Temperature</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {leadsResult.leads.slice(0, 10).map((lead: any) => (
                  <tr key={lead.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/50">
                    <td className="py-3">
                      <div className="text-white">{lead.name || "Anonymous"}</div>
                      <div className="text-xs text-neutral-500">{lead.email || lead.phone || "No contact"}</div>
                    </td>
                    <td className="py-3 text-neutral-400">{lead.source}</td>
                    <td className="py-3 font-medium text-white">{lead.lead_score}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        lead.lead_temperature === "HOT" ? "bg-red-500/20 text-red-400" :
                        lead.lead_temperature === "WARM" ? "bg-amber-500/20 text-amber-400" :
                        "bg-neutral-500/20 text-neutral-400"
                      }`}>
                        {lead.lead_temperature}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        lead.status === "CONVERTED" ? "bg-emerald-500/20 text-emerald-400" :
                        lead.status === "QUALIFIED" ? "bg-green-500/20 text-green-400" :
                        lead.status === "CONTACTED" ? "bg-blue-500/20 text-blue-400" :
                        lead.status === "LOST" ? "bg-neutral-500/20 text-neutral-500" :
                        "bg-indigo-500/20 text-indigo-400"
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-neutral-500">
                      {new Date(lead.last_activity_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Activity */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <h2 className="mb-4 text-sm font-medium text-neutral-300">Event Activity (30 days)</h2>
        {Object.keys(eventStats).length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-600">No events tracked yet</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(eventStats)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 15)
              .map(([type, count]) => (
                <div key={type} className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
                  <div className="text-xs text-neutral-500">{type.replace(/_/g, " ")}</div>
                  <div className="text-lg font-medium text-white">{count as number}</div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
