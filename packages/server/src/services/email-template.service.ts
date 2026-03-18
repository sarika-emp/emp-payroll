import { getDB } from "../db/adapters";

/**
 * Email template engine with variable substitution.
 * Templates can be stored per-org or use defaults.
 *
 * Variables available in templates:
 * - {{employee_name}}, {{employee_code}}, {{email}}
 * - {{period}}, {{month}}, {{year}}
 * - {{gross_pay}}, {{net_pay}}, {{total_deductions}}
 * - {{earnings_table}}, {{deductions_table}}
 * - {{org_name}}, {{org_address}}
 */

export interface TemplateVars {
  employee_name: string;
  employee_code: string;
  email: string;
  period: string;
  month: number;
  year: number;
  gross_pay: string;
  net_pay: string;
  total_deductions: string;
  earnings_table: string;
  deductions_table: string;
  org_name: string;
  org_address: string;
  [key: string]: any;
}

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  payslip: {
    subject: "Your Payslip for {{period}} — {{org_name}}",
    body: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f9fafb">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
  <div style="background:{{brand_color}};color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center">
    <h1 style="margin:0;font-size:20px">{{org_name}}</h1>
    <p style="margin:8px 0 0;opacity:0.8;font-size:14px">Payslip for {{period}}</p>
  </div>
  <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none">
    <p style="margin:0 0 16px;color:#374151">Hi {{employee_name}},</p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px">Your payslip for {{period}} is ready. Here's a summary:</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr>
        <td style="padding:12px;background:#f0fdf4;border-radius:8px;text-align:center;width:33%">
          <div style="font-size:12px;color:#16a34a">Gross Pay</div>
          <div style="font-size:18px;font-weight:700;color:#15803d;margin-top:4px">{{gross_pay}}</div>
        </td>
        <td style="padding:12px;background:#fef2f2;border-radius:8px;text-align:center;width:33%">
          <div style="font-size:12px;color:#dc2626">Deductions</div>
          <div style="font-size:18px;font-weight:700;color:#b91c1c;margin-top:4px">{{total_deductions}}</div>
        </td>
        <td style="padding:12px;background:#eef2ff;border-radius:8px;text-align:center;width:33%">
          <div style="font-size:12px;color:#4f46e5">Net Pay</div>
          <div style="font-size:18px;font-weight:700;color:#4338ca;margin-top:4px">{{net_pay}}</div>
        </td>
      </tr>
    </table>
    {{earnings_table}}
    {{deductions_table}}
    <p style="margin:16px 0 0;color:#6b7280;font-size:13px">Log in to your employee portal to view the full payslip and download the PDF.</p>
  </div>
  <div style="padding:16px;text-align:center;color:#9ca3af;font-size:12px;border-radius:0 0 12px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none">
    This is an automated email from {{org_name}}. Do not reply.
  </div>
</div>
</body></html>`,
  },

  welcome: {
    subject: "Welcome to {{org_name}} — Your account is ready",
    body: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;margin:0;padding:0;background:#f9fafb">
<div style="max-width:500px;margin:0 auto;padding:40px 20px">
  <div style="background:white;padding:32px;border-radius:12px;border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px;color:#111827">Welcome, {{employee_name}}!</h2>
    <p style="color:#6b7280;font-size:14px">Your employee account at <strong>{{org_name}}</strong> has been created.</p>
    <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:20px 0">
      <p style="margin:0;font-size:14px"><strong>Employee Code:</strong> {{employee_code}}</p>
      <p style="margin:8px 0 0;font-size:14px"><strong>Email:</strong> {{email}}</p>
      <p style="margin:8px 0 0;font-size:14px"><strong>Default Password:</strong> Welcome@123</p>
    </div>
    <p style="color:#6b7280;font-size:13px">Please log in and change your password immediately.</p>
  </div>
</div>
</body></html>`,
  },

  declaration_reminder: {
    subject: "Tax Declaration Deadline Approaching — {{org_name}}",
    body: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;margin:0;padding:0;background:#f9fafb">
<div style="max-width:500px;margin:0 auto;padding:40px 20px">
  <div style="background:white;padding:32px;border-radius:12px;border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px;color:#111827">Tax Declaration Reminder</h2>
    <p style="color:#6b7280;font-size:14px">Hi {{employee_name}},</p>
    <p style="color:#6b7280;font-size:14px">The deadline for submitting your investment proofs for FY {{financial_year}} is approaching.</p>
    <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:20px 0;border:1px solid #fcd34d">
      <p style="margin:0;font-size:14px;color:#92400e"><strong>Deadline:</strong> {{deadline_date}}</p>
    </div>
    <p style="color:#6b7280;font-size:13px">Please log in to the self-service portal and submit your declarations under Section 80C, 80D, HRA, etc.</p>
  </div>
</div>
</body></html>`,
  },

  payroll_approved: {
    subject: "Payroll Approved for {{period}} — {{org_name}}",
    body: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;margin:0;padding:0;background:#f9fafb">
<div style="max-width:500px;margin:0 auto;padding:40px 20px">
  <div style="background:white;padding:32px;border-radius:12px;border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px;color:#111827">Payroll Approved</h2>
    <p style="color:#6b7280;font-size:14px">The payroll for <strong>{{period}}</strong> has been approved and is ready for payment.</p>
    <table style="width:100%;margin:20px 0">
      <tr><td style="padding:8px 0;color:#6b7280">Employees</td><td style="text-align:right;font-weight:600">{{employee_count}}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Total Gross</td><td style="text-align:right;font-weight:600">{{gross_pay}}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Total Net</td><td style="text-align:right;font-weight:600">{{net_pay}}</td></tr>
    </table>
  </div>
</div>
</body></html>`,
  },
};

export class EmailTemplateService {
  private db = getDB();

  /**
   * Get a template by name. Checks org-specific override first, falls back to default.
   */
  async getTemplate(templateName: string, _orgId?: string): Promise<{ subject: string; body: string }> {
    // In future: check org_email_templates table for override
    // For now, return defaults
    const template = DEFAULT_TEMPLATES[templateName];
    if (!template) {
      return { subject: "{{org_name}} Notification", body: "<p>{{message}}</p>" };
    }
    return template;
  }

  /**
   * Render a template with variable substitution.
   */
  render(template: string, vars: Partial<TemplateVars>): string {
    let result = template;
    // Default brand color
    const allVars = { brand_color: "#4f46e5", ...vars };
    for (const [key, value] of Object.entries(allVars)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value ?? ""));
    }
    return result;
  }

  /**
   * Get all available template names with descriptions.
   */
  listTemplates() {
    return Object.keys(DEFAULT_TEMPLATES).map((name) => ({
      name,
      subject: DEFAULT_TEMPLATES[name].subject,
      description: {
        payslip: "Monthly payslip notification sent to employees",
        welcome: "Welcome email sent when a new employee is created",
        declaration_reminder: "Tax declaration deadline reminder",
        payroll_approved: "Notification when payroll is approved",
      }[name] || name,
    }));
  }

  /**
   * Preview a template with sample data.
   */
  async preview(templateName: string, orgId?: string) {
    const template = await this.getTemplate(templateName, orgId);
    const sampleVars: Partial<TemplateVars> = {
      employee_name: "John Doe",
      employee_code: "EMP-001",
      email: "john@example.com",
      period: "March 2026",
      month: 3,
      year: 2026,
      gross_pay: "₹89,867",
      net_pay: "₹87,867",
      total_deductions: "₹2,000",
      earnings_table: "<p>Basic: ₹36,667 | HRA: ₹18,334 | SA: ₹34,866</p>",
      deductions_table: "<p>EPF: ₹1,800 | PT: ₹200</p>",
      org_name: "TechNova Solutions",
      org_address: "Bengaluru, Karnataka",
      brand_color: "#4f46e5",
    };
    return {
      subject: this.render(template.subject, sampleVars),
      body: this.render(template.body, sampleVars),
    };
  }
}
