import { Router } from "express";
import { EarnedWageService } from "../../services/earned-wage.service";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  validate,
  earnedWageSettingsSchema,
  earnedWageRequestSchema,
  earnedWageRejectSchema,
} from "../validators";
import { wrap, param } from "../helpers";

const router = Router();
const svc = new EarnedWageService();

router.use(authenticate);

// ---------------------------------------------------------------------------
// Settings (HR only)
// ---------------------------------------------------------------------------
router.get(
  "/settings",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.getSettings(String(req.user!.empcloudOrgId));
    res.json({ success: true, data });
  }),
);

router.put(
  "/settings",
  authorize("hr_admin"),
  validate(earnedWageSettingsSchema),
  wrap(async (req, res) => {
    const data = await svc.updateSettings(String(req.user!.empcloudOrgId), req.body);
    res.json({ success: true, data });
  }),
);

// ---------------------------------------------------------------------------
// Employee endpoints
// ---------------------------------------------------------------------------
router.get(
  "/available",
  wrap(async (req, res) => {
    const data = await svc.calculateAvailable(
      String(req.user!.empcloudOrgId),
      String(req.user!.empcloudUserId),
    );
    res.json({ success: true, data });
  }),
);

router.post(
  "/request",
  validate(earnedWageRequestSchema),
  wrap(async (req, res) => {
    const data = await svc.requestAdvance(
      String(req.user!.empcloudOrgId),
      String(req.user!.empcloudUserId),
      req.body.amount,
      req.body.reason,
    );
    res.status(201).json({ success: true, data });
  }),
);

router.get(
  "/my",
  wrap(async (req, res) => {
    const data = await svc.getMyRequests(
      String(req.user!.empcloudOrgId),
      String(req.user!.empcloudUserId),
    );
    res.json({ success: true, data: data.data, meta: { total: data.total } });
  }),
);

// ---------------------------------------------------------------------------
// HR endpoints
// ---------------------------------------------------------------------------
router.get(
  "/requests",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.listRequests(String(req.user!.empcloudOrgId), {
      status: req.query.status as string,
      employeeId: req.query.employeeId as string,
    });
    res.json({ success: true, data: data.data, meta: { total: data.total } });
  }),
);

router.post(
  "/requests/:id/approve",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.approveRequest(
      String(req.user!.empcloudOrgId),
      param(req, "id"),
      String(req.user!.empcloudUserId),
    );
    res.json({ success: true, data });
  }),
);

router.post(
  "/requests/:id/reject",
  authorize("hr_admin", "hr_manager"),
  validate(earnedWageRejectSchema),
  wrap(async (req, res) => {
    const data = await svc.rejectRequest(
      String(req.user!.empcloudOrgId),
      param(req, "id"),
      req.body.reason,
    );
    res.json({ success: true, data });
  }),
);

router.get(
  "/dashboard",
  authorize("hr_admin", "hr_manager"),
  wrap(async (req, res) => {
    const data = await svc.getDashboard(String(req.user!.empcloudOrgId));
    res.json({ success: true, data });
  }),
);

export { router as earnedWageRoutes };
