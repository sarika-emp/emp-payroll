import { v4 as uuid } from "uuid";
import { getDB } from "../db/adapters";
import { AppError } from "../api/middleware/error.middleware";

/**
 * Generic approval workflow service.
 * Supports: reimbursements, loans, tax declarations, salary revisions, payroll runs
 */
export class ApprovalService {
  private db = getDB();

  // Default approval rules (can be overridden per org via settings)
  private rules: Record<string, { requiredRole: string; autoApproveBelow?: number }> = {
    reimbursement: { requiredRole: "hr_manager", autoApproveBelow: 1000 },
    loan: { requiredRole: "hr_admin" },
    tax_declaration: { requiredRole: "hr_manager" },
    salary_revision: { requiredRole: "hr_admin" },
    payroll: { requiredRole: "hr_admin" },
  };

  async requestApproval(params: {
    orgId: string;
    entityType: string;
    entityId: string;
    requestedBy: string;
    amount?: number;
    description?: string;
  }) {
    const rule = this.rules[params.entityType];
    if (!rule) throw new AppError(400, "UNKNOWN_TYPE", `Unknown approval type: ${params.entityType}`);

    // Auto-approve if amount is below threshold
    if (rule.autoApproveBelow && params.amount && params.amount < rule.autoApproveBelow) {
      return {
        id: uuid(),
        status: "auto_approved",
        entityType: params.entityType,
        entityId: params.entityId,
        message: `Auto-approved: amount ${params.amount} below threshold ${rule.autoApproveBelow}`,
      };
    }

    return {
      id: uuid(),
      status: "pending",
      entityType: params.entityType,
      entityId: params.entityId,
      requiredRole: rule.requiredRole,
      requestedBy: params.requestedBy,
      description: params.description,
    };
  }

  async approve(params: {
    entityType: string;
    entityId: string;
    approvedBy: string;
    approverRole: string;
    comments?: string;
  }) {
    const rule = this.rules[params.entityType];
    if (!rule) throw new AppError(400, "UNKNOWN_TYPE", `Unknown approval type: ${params.entityType}`);

    // Check if approver has required role
    const allowedRoles = ["hr_admin"]; // hr_admin can approve anything
    if (rule.requiredRole === "hr_manager") allowedRoles.push("hr_manager");

    if (!allowedRoles.includes(params.approverRole)) {
      throw new AppError(403, "INSUFFICIENT_ROLE", `Requires ${rule.requiredRole} or higher to approve ${params.entityType}`);
    }

    return {
      status: "approved",
      entityType: params.entityType,
      entityId: params.entityId,
      approvedBy: params.approvedBy,
      approvedAt: new Date().toISOString(),
      comments: params.comments,
    };
  }

  async reject(params: {
    entityType: string;
    entityId: string;
    rejectedBy: string;
    reason: string;
  }) {
    return {
      status: "rejected",
      entityType: params.entityType,
      entityId: params.entityId,
      rejectedBy: params.rejectedBy,
      rejectedAt: new Date().toISOString(),
      reason: params.reason,
    };
  }

  getApprovalRules() {
    return this.rules;
  }
}
