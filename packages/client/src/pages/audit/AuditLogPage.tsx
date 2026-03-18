import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { apiGet } from "@/api/client";
import { getUser } from "@/api/auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Clock, UserPlus, Play, CheckCircle2, CreditCard, Settings, FileText, Users, Search, Filter } from "lucide-react";

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  "employee.created": { icon: UserPlus, color: "text-green-600", label: "Employee Created" },
  "employee.updated": { icon: Users, color: "text-blue-600", label: "Employee Updated" },
  "payroll.created": { icon: Play, color: "text-purple-600", label: "Payroll Created" },
  "payroll.computed": { icon: Play, color: "text-indigo-600", label: "Payroll Computed" },
  "payroll.approved": { icon: CheckCircle2, color: "text-green-600", label: "Payroll Approved" },
  "payroll.paid": { icon: CreditCard, color: "text-emerald-600", label: "Payroll Paid" },
  "payroll.cancelled": { icon: CreditCard, color: "text-red-600", label: "Payroll Cancelled" },
  "salary.assigned": { icon: FileText, color: "text-blue-600", label: "Salary Assigned" },
  "salary.revised": { icon: FileText, color: "text-orange-600", label: "Salary Revised" },
  "settings.updated": { icon: Settings, color: "text-gray-600", label: "Settings Updated" },
  "document.uploaded": { icon: FileText, color: "text-blue-500", label: "Document Uploaded" },
  "login.success": { icon: Users, color: "text-green-500", label: "Login" },
};

const ACTION_TYPES = [
  { value: "", label: "All Actions" },
  { value: "employee", label: "Employee" },
  { value: "payroll", label: "Payroll" },
  { value: "salary", label: "Salary" },
  { value: "settings", label: "Settings" },
  { value: "login", label: "Login" },
];

const ENTITY_TYPES = [
  { value: "", label: "All Entities" },
  { value: "employee", label: "Employee" },
  { value: "payroll_run", label: "Payroll Run" },
  { value: "payslip", label: "Payslip" },
  { value: "salary", label: "Salary" },
  { value: "organization", label: "Organization" },
];

const columns = [
  {
    key: "action",
    header: "Action",
    render: (row: any) => {
      const config = ACTION_CONFIG[row.action] || { icon: Clock, color: "text-gray-500", label: row.action };
      const Icon = config.icon;
      return (
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className="font-medium">{config.label}</span>
        </div>
      );
    },
  },
  {
    key: "entity_type",
    header: "Entity",
    render: (row: any) => (
      <Badge variant="draft">{row.entity_type}</Badge>
    ),
  },
  {
    key: "entity_id",
    header: "Entity ID",
    render: (row: any) => (
      <span className="font-mono text-xs text-gray-500">{row.entity_id?.slice(0, 8) || "—"}</span>
    ),
  },
  {
    key: "user_id",
    header: "User",
    render: (row: any) => (
      <span className="font-mono text-xs text-gray-500">{row.user_id?.slice(0, 8)}...</span>
    ),
  },
  {
    key: "ip_address",
    header: "IP",
    render: (row: any) => row.ip_address || "—",
  },
  {
    key: "created_at",
    header: "Time",
    render: (row: any) => (
      <span className="text-sm text-gray-500">
        {new Date(row.created_at).toLocaleString("en-IN", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        })}
      </span>
    ),
  },
];

export function AuditLogPage() {
  const user = getUser();
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: res, isLoading } = useQuery({
    queryKey: ["audit-logs", user?.orgId],
    queryFn: () => apiGet<any>(`/organizations/${user?.orgId}/activity`, { limit: 200 }),
    enabled: !!user?.orgId,
  });

  const allLogs = res?.data?.data || [];

  // Apply client-side filters
  const logs = allLogs.filter((log: any) => {
    if (actionFilter && !log.action?.startsWith(actionFilter)) return false;
    if (entityFilter && log.entity_type !== entityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (log.action?.toLowerCase().includes(q) ||
              log.entity_type?.toLowerCase().includes(q) ||
              log.entity_id?.toLowerCase().includes(q) ||
              log.user_id?.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description={`${logs.length} of ${allLogs.length} entries`}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {ACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {ENTITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">
              {allLogs.length > 0 ? "No logs match your filters" : "No audit logs yet"}
            </p>
            <p className="mt-1 text-sm text-gray-400">Actions like creating employees, running payroll, and changing settings will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable columns={columns} data={logs} pageSize={20} />
      )}
    </div>
  );
}
