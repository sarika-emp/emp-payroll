import { Request, Response, NextFunction } from "express";
import { getDB } from "../../db/adapters";

/**
 * Middleware to enforce payroll lock period.
 * Blocks writes (POST/PUT/DELETE) to payroll-related data
 * for months before the organization's lock date.
 *
 * Usage: router.use(enforcePayrollLock);
 */
export async function enforcePayrollLock(req: Request, res: Response, next: NextFunction) {
  // Only enforce on write operations
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }

  // Get org lock date
  const orgId = (req as any).user?.orgId;
  if (!orgId) return next();

  try {
    const db = getDB();
    const org = await db.findById<any>("organizations", orgId);
    if (!org?.payroll_lock_date) return next(); // No lock set

    const lockDate = new Date(org.payroll_lock_date);

    // Check if the request body references a locked month
    const month = req.body?.month || req.query?.month;
    const year = req.body?.year || req.query?.year;

    if (month && year) {
      const requestDate = new Date(Number(year), Number(month) - 1, 28);
      if (requestDate <= lockDate) {
        return res.status(403).json({
          success: false,
          error: {
            code: "PAYROLL_LOCKED",
            message: `Payroll data for ${month}/${year} is locked. Lock date: ${org.payroll_lock_date}. Contact HR Admin to unlock.`,
          },
        });
      }
    }

    next();
  } catch {
    next(); // Don't block on errors
  }
}
