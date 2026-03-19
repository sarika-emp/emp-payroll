import { Router } from "express";
import { WebhookService } from "../../services/webhook.service";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { wrap, param } from "../helpers";

const router = Router();
const svc = new WebhookService();

router.use(authenticate, authorize("hr_admin"));

router.get(
  "/",
  wrap(async (req, res) => {
    const data = await svc.list(String(req.user!.empcloudOrgId));
    res.json({ success: true, data });
  }),
);

router.post(
  "/",
  wrap(async (req, res) => {
    const data = await svc.register(String(req.user!.empcloudOrgId), {
      url: req.body.url,
      events: req.body.events || ["*"],
      secret: req.body.secret,
    });
    res.status(201).json({ success: true, data });
  }),
);

router.delete(
  "/:id",
  wrap(async (req, res) => {
    const deleted = await svc.delete(String(req.user!.empcloudOrgId), param(req, "id"));
    res.json({ success: true, data: { deleted } });
  }),
);

router.post(
  "/:id/toggle",
  wrap(async (req, res) => {
    const data = await svc.toggle(String(req.user!.empcloudOrgId), param(req, "id"));
    res.json({ success: true, data });
  }),
);

router.get(
  "/deliveries",
  wrap(async (req, res) => {
    const data = await svc.getDeliveries(
      String(req.user!.empcloudOrgId),
      Number(req.query.limit) || 20,
    );
    res.json({ success: true, data });
  }),
);

// Test endpoint: send a test event
router.post(
  "/test",
  wrap(async (req, res) => {
    const delivered = await svc.dispatch(String(req.user!.empcloudOrgId), "test.ping", {
      message: "This is a test webhook event",
      timestamp: new Date().toISOString(),
    });
    res.json({ success: true, data: { delivered, message: `Sent to ${delivered} webhook(s)` } });
  }),
);

export { router as webhookRoutes };
