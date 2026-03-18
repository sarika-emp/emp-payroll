import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/SelectField";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import { Plus, Calendar, Trash2 } from "lucide-react";

// Local state holidays — in a full app these would come from the API
const DEFAULT_HOLIDAYS = [
  { id: "1", name: "Republic Day", date: "2026-01-26", type: "national", day: "Monday" },
  { id: "2", name: "Holi", date: "2026-03-10", type: "national", day: "Tuesday" },
  { id: "3", name: "Good Friday", date: "2026-04-03", type: "national", day: "Friday" },
  { id: "4", name: "Eid ul-Fitr", date: "2026-04-01", type: "national", day: "Wednesday" },
  { id: "5", name: "May Day", date: "2026-05-01", type: "national", day: "Friday" },
  { id: "6", name: "Independence Day", date: "2026-08-15", type: "national", day: "Saturday" },
  { id: "7", name: "Ganesh Chaturthi", date: "2026-08-27", type: "regional", day: "Thursday" },
  { id: "8", name: "Gandhi Jayanti", date: "2026-10-02", type: "national", day: "Friday" },
  { id: "9", name: "Dussehra", date: "2026-10-12", type: "national", day: "Monday" },
  { id: "10", name: "Diwali", date: "2026-11-08", type: "national", day: "Sunday" },
  { id: "11", name: "Christmas", date: "2026-12-25", type: "national", day: "Friday" },
];

export function HolidaysPage() {
  const [holidays, setHolidays] = useState(DEFAULT_HOLIDAYS);
  const [showAdd, setShowAdd] = useState(false);
  const [year] = useState(new Date().getFullYear());

  const upcoming = holidays
    .filter((h) => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const past = holidays
    .filter((h) => new Date(h.date) < new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function addHoliday(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = fd.get("date") as string;
    const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
    setHolidays([...holidays, {
      id: String(Date.now()),
      name: fd.get("name") as string,
      date,
      type: fd.get("type") as string,
      day: dayName,
    }]);
    setShowAdd(false);
  }

  function removeHoliday(id: string) {
    setHolidays(holidays.filter((h) => h.id !== id));
  }

  const columns = [
    {
      key: "name",
      header: "Holiday",
      render: (r: any) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    {
      key: "date",
      header: "Date",
      render: (r: any) => (
        <span>{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
      ),
    },
    {
      key: "day",
      header: "Day",
    },
    {
      key: "type",
      header: "Type",
      render: (r: any) => (
        <Badge variant={r.type === "national" ? "approved" : r.type === "regional" ? "pending" : "draft"}>
          {r.type}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r: any) => (
        <Button variant="ghost" size="sm" onClick={() => removeHoliday(r.id)} className="text-red-400 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // Calendar mini view
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday Calendar"
        description={`${year} — ${holidays.length} holidays configured`}
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add Holiday
          </Button>
        }
      />

      {/* Calendar overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {months.map((month) => {
          const monthHolidays = holidays.filter((h) => new Date(h.date).getMonth() === month);
          const monthName = new Date(year, month).toLocaleString("en-US", { month: "long" });
          return (
            <Card key={month} className={monthHolidays.length > 0 ? "border-brand-200" : ""}>
              <CardContent className="py-3">
                <p className="text-xs font-semibold text-gray-500">{monthName}</p>
                {monthHolidays.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {monthHolidays.map((h) => (
                      <div key={h.id} className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        <span className="text-xs text-gray-700">{h.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-300">No holidays</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Upcoming Holidays</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable columns={columns} data={upcoming} />
          </CardContent>
        </Card>
      )}

      {/* Past */}
      {past.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Past Holidays</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable columns={columns} data={past} />
          </CardContent>
        </Card>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Holiday">
        <form onSubmit={addHoliday} className="space-y-4">
          <Input id="name" name="name" label="Holiday Name" placeholder="e.g. Diwali" required />
          <Input id="date" name="date" label="Date" type="date" required />
          <SelectField id="type" name="type" label="Type" options={[
            { value: "national", label: "National" },
            { value: "regional", label: "Regional" },
            { value: "optional", label: "Optional / Restricted" },
          ]} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Add Holiday</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
