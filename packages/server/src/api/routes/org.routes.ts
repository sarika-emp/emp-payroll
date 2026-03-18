import { Router } from "express";
import { OrgService } from "../../services/org.service";
import { AuditService } from "../../services/audit.service";
import { EmailTemplateService } from "../../services/email-template.service";
import { NotificationService } from "../../services/notification.service";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate, createOrgSchema } from "../validators";
import { wrap, param } from "../helpers";

const router = Router();
const svc = new OrgService();

router.use(authenticate);

router.get("/", authorize("super_admin", "hr_admin"), wrap(async (_req, res) => {
  const data = await svc.list();
  res.json({ success: true, data });
}));

router.get("/:id", wrap(async (req, res) => {
  const data = await svc.getById(param(req, "id"));
  res.json({ success: true, data });
}));

router.post("/", authorize("super_admin", "hr_admin"), validate(createOrgSchema), wrap(async (req, res) => {
  const data = await svc.create(req.body);
  res.status(201).json({ success: true, data });
}));

router.put("/:id", authorize("hr_admin"), wrap(async (req, res) => {
  const data = await svc.update(param(req, "id"), req.body);
  res.json({ success: true, data });
}));

router.get("/:id/settings", wrap(async (req, res) => {
  const data = await svc.getSettings(param(req, "id"));
  res.json({ success: true, data });
}));

router.put("/:id/settings", authorize("hr_admin"), wrap(async (req, res) => {
  const data = await svc.updateSettings(param(req, "id"), req.body);
  res.json({ success: true, data });
}));

// Payroll lock period
router.get("/:id/payroll-lock", authorize("hr_admin"), wrap(async (req, res) => {
  const org = await svc.getById(param(req, "id"));
  res.json({ success: true, data: { lockDate: org.payroll_lock_date } });
}));

router.post("/:id/payroll-lock", authorize("hr_admin"), wrap(async (req, res) => {
  const lockDate = req.body.lockDate; // YYYY-MM-DD
  if (!lockDate) {
    return res.status(400).json({ success: false, error: { code: "MISSING_DATE", message: "lockDate is required (YYYY-MM-DD)" } });
  }
  await svc.update(param(req, "id"), { payrollLockDate: lockDate });
  res.json({ success: true, data: { message: `Payroll locked up to ${lockDate}`, lockDate } });
}));

router.delete("/:id/payroll-lock", authorize("hr_admin"), wrap(async (req, res) => {
  await svc.update(param(req, "id"), { payrollLockDate: null });
  res.json({ success: true, data: { message: "Payroll lock removed" } });
}));

router.get("/:id/activity", authorize("hr_admin", "hr_manager"), wrap(async (req, res) => {
  const auditSvc = new AuditService();
  const data = await auditSvc.getRecent(param(req, "id"), Number(req.query.limit) || 20);
  res.json({ success: true, data });
}));

// Notifications
router.post("/:id/notify/declaration-reminder", authorize("hr_admin"), wrap(async (req, res) => {
  const notifSvc = new NotificationService();
  const data = await notifSvc.sendDeclarationReminders(param(req, "id"), {
    financialYear: req.body.financialYear,
    deadlineDate: req.body.deadlineDate,
  });
  res.json({ success: true, data });
}));

// Email templates
router.get("/:id/email-templates", authorize("hr_admin"), wrap(async (_req, res) => {
  const tmplSvc = new EmailTemplateService();
  const templates = tmplSvc.listTemplates();
  res.json({ success: true, data: templates });
}));

router.get("/:id/email-templates/:name/preview", authorize("hr_admin"), wrap(async (req, res) => {
  const tmplSvc = new EmailTemplateService();
  const preview = await tmplSvc.preview(req.params.name as string, param(req, "id"));
  res.json({ success: true, data: preview });
}));

router.get("/:id/email-templates/:name/preview-html", authorize("hr_admin"), wrap(async (req, res) => {
  const tmplSvc = new EmailTemplateService();
  const preview = await tmplSvc.preview(req.params.name as string, param(req, "id"));
  res.setHeader("Content-Type", "text/html");
  res.send(preview.body);
}));

export { router as orgRoutes };
