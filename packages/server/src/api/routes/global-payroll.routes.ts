import { Router } from "express";
import { GlobalPayrollService } from "../../services/global-payroll.service";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  validate,
  addGlobalEmployeeSchema,
  updateGlobalEmployeeSchema,
  createGlobalPayrollRunSchema,
  submitContractorInvoiceSchema,
  updateComplianceItemSchema,
} from "../validators";
import { wrap, param } from "../helpers";

const router = Router();
const svc = new GlobalPayrollService();

router.use(authenticate);

// ---------------------------------------------------------------------------
// Dashboard & Analytics
// ---------------------------------------------------------------------------
router.get(
  "/dashboard",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.getGlobalDashboard(String(req.user!.empcloudOrgId));
    res.json({ success: true, data });
  }),
);

router.get(
  "/cost-analysis",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.getCostAnalysis(String(req.user!.empcloudOrgId));
    res.json({ success: true, data });
  }),
);

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------
router.get(
  "/countries",
  wrap(async (req, res) => {
    const data = await svc.listCountries({
      region: req.query.region as string,
      isActive: req.query.isActive as string,
    });
    res.json({
      success: true,
      data: data.data,
      meta: { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages },
    });
  }),
);

router.get(
  "/countries/:id",
  wrap(async (req, res) => {
    const data = await svc.getCountry(param(req, "id"));
    res.json({ success: true, data });
  }),
);

// ---------------------------------------------------------------------------
// Global Employees
// ---------------------------------------------------------------------------
router.post(
  "/employees",
  authorize("hr_admin", "hr_manager"),
  validate(addGlobalEmployeeSchema),
  wrap(async (req, res) => {
    const data = await svc.addGlobalEmployee(String(req.user!.empcloudOrgId), req.body);
    res.status(201).json({ success: true, data });
  }),
);

router.get(
  "/employees",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.listGlobalEmployees(String(req.user!.empcloudOrgId), {
      countryId: req.query.countryId as string,
      employmentType: req.query.employmentType as string,
      status: req.query.status as string,
      search: req.query.search as string,
    });
    res.json({
      success: true,
      data: data.data,
      meta: { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages },
    });
  }),
);

router.get(
  "/employees/:id",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.getGlobalEmployee(String(req.user!.empcloudOrgId), param(req, "id"));
    res.json({ success: true, data });
  }),
);

router.put(
  "/employees/:id",
  authorize("hr_admin", "hr_manager"),
  validate(updateGlobalEmployeeSchema),
  wrap(async (req, res) => {
    const data = await svc.updateGlobalEmployee(
      String(req.user!.empcloudOrgId),
      param(req, "id"),
      req.body,
    );
    res.json({ success: true, data });
  }),
);

router.post(
  "/employees/:id/terminate",
  authorize("hr_admin"),
  wrap(async (req, res) => {
    const data = await svc.terminateGlobalEmployee(
      String(req.user!.empcloudOrgId),
      param(req, "id"),
      req.body.reason,
    );
    res.json({ success: true, data });
  }),
);

// ---------------------------------------------------------------------------
// Global Payroll Runs
// ---------------------------------------------------------------------------
router.post(
  "/payroll-runs",
  authorize("hr_admin", "hr_manager"),
  validate(createGlobalPayrollRunSchema),
  wrap(async (req, res) => {
    const data = await svc.createPayrollRun(
      String(req.user!.empcloudOrgId),
      req.body.countryId,
      req.body.month,
      req.body.year,
    );
    res.status(201).json({ success: true, data });
  }),
);

router.get(
  "/payroll-runs",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.listPayrollRuns(String(req.user!.empcloudOrgId), {
      countryId: req.query.countryId as string,
      status: req.query.status as string,
      year: req.query.year ? Number(req.query.year) : undefined,
    });
    res.json({
      success: true,
      data: data.data,
      meta: { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages },
    });
  }),
);

router.get(
  "/payroll-runs/:id",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.getPayrollRun(String(req.user!.empcloudOrgId), param(req, "id"));
    res.json({ success: true, data });
  }),
);

router.post(
  "/payroll-runs/:id/approve",
  authorize("hr_admin"),
  wrap(async (req, res) => {
    const data = await svc.approvePayrollRun(
      String(req.user!.empcloudOrgId),
      param(req, "id"),
      String(req.user!.empcloudUserId),
    );
    res.json({ success: true, data });
  }),
);

router.post(
  "/payroll-runs/:id/paid",
  authorize("hr_admin"),
  wrap(async (req, res) => {
    const data = await svc.markPayrollRunPaid(String(req.user!.empcloudOrgId), param(req, "id"));
    res.json({ success: true, data });
  }),
);

// ---------------------------------------------------------------------------
// Contractor Invoices
// ---------------------------------------------------------------------------
router.post(
  "/invoices",
  authorize("hr_admin", "hr_manager"),
  validate(submitContractorInvoiceSchema),
  wrap(async (req, res) => {
    const data = await svc.submitContractorInvoice(
      String(req.user!.empcloudOrgId),
      req.body.globalEmployeeId,
      req.body,
    );
    res.status(201).json({ success: true, data });
  }),
);

router.get(
  "/invoices",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.listContractorInvoices(String(req.user!.empcloudOrgId), {
      status: req.query.status as string,
      employeeId: req.query.employeeId as string,
    });
    res.json({
      success: true,
      data: data.data,
      meta: { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages },
    });
  }),
);

router.post(
  "/invoices/:id/approve",
  authorize("hr_admin"),
  wrap(async (req, res) => {
    const data = await svc.approveContractorInvoice(
      String(req.user!.empcloudOrgId),
      param(req, "id"),
      String(req.user!.empcloudUserId),
    );
    res.json({ success: true, data });
  }),
);

router.post(
  "/invoices/:id/reject",
  authorize("hr_admin"),
  wrap(async (req, res) => {
    const data = await svc.rejectContractorInvoice(
      String(req.user!.empcloudOrgId),
      param(req, "id"),
    );
    res.json({ success: true, data });
  }),
);

router.post(
  "/invoices/:id/paid",
  authorize("hr_admin"),
  wrap(async (req, res) => {
    const data = await svc.markInvoicePaid(String(req.user!.empcloudOrgId), param(req, "id"));
    res.json({ success: true, data });
  }),
);

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------
router.get(
  "/compliance/:empId",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.getComplianceChecklist(
      String(req.user!.empcloudOrgId),
      param(req, "empId"),
    );
    res.json({ success: true, data });
  }),
);

router.put(
  "/compliance/:itemId",
  authorize("hr_admin", "hr_manager"),
  validate(updateComplianceItemSchema),
  wrap(async (req, res) => {
    const data = await svc.updateChecklistItem(
      String(req.user!.empcloudOrgId),
      param(req, "itemId"),
      req.body.completed,
      String(req.user!.empcloudUserId),
    );
    res.json({ success: true, data });
  }),
);

router.post(
  "/compliance/:empId/items",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.addChecklistItem(
      String(req.user!.empcloudOrgId),
      param(req, "empId"),
      req.body,
    );
    res.status(201).json({ success: true, data });
  }),
);

export { router as globalPayrollRoutes };
