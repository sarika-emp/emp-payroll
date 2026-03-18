import { Request, Response } from "express";

const apiDoc = {
  openapi: "3.0.3",
  info: {
    title: "EMP Payroll API",
    version: "0.1.0",
    description: "Open-source payroll management API — India statutory compliance (PF, ESI, PT, TDS)",
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object" },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        security: [],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, required: ["email", "password"] } } } },
        responses: { "200": { description: "JWT tokens + user data" } },
      },
    },
    "/auth/register": {
      post: { tags: ["Auth"], summary: "Register new user", security: [] },
    },
    "/auth/refresh-token": {
      post: { tags: ["Auth"], summary: "Refresh JWT tokens", security: [] },
    },
    "/auth/change-password": {
      post: { tags: ["Auth"], summary: "Change password (authenticated)" },
    },
    "/employees": {
      get: { tags: ["Employees"], summary: "List employees", parameters: [{ name: "page", in: "query", schema: { type: "integer" } }, { name: "limit", in: "query", schema: { type: "integer" } }, { name: "department", in: "query", schema: { type: "string" } }] },
      post: { tags: ["Employees"], summary: "Create employee" },
    },
    "/employees/{id}": {
      get: { tags: ["Employees"], summary: "Get employee by ID", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }] },
      put: { tags: ["Employees"], summary: "Update employee" },
      delete: { tags: ["Employees"], summary: "Deactivate employee" },
    },
    "/employees/{id}/bank-details": { get: { tags: ["Employees"], summary: "Get bank details" }, put: { tags: ["Employees"], summary: "Update bank details" } },
    "/employees/{id}/tax-info": { get: { tags: ["Employees"], summary: "Get tax info" }, put: { tags: ["Employees"], summary: "Update tax info" } },
    "/employees/{id}/pf-details": { get: { tags: ["Employees"], summary: "Get PF details" }, put: { tags: ["Employees"], summary: "Update PF details" } },
    "/employees/export": { get: { tags: ["Employees"], summary: "Export employees CSV" } },
    "/salary-structures": {
      get: { tags: ["Salary"], summary: "List salary structures" },
      post: { tags: ["Salary"], summary: "Create salary structure with components" },
    },
    "/salary-structures/{id}": { get: { tags: ["Salary"], summary: "Get salary structure" }, put: { tags: ["Salary"], summary: "Update salary structure" }, delete: { tags: ["Salary"], summary: "Delete salary structure" } },
    "/salary-structures/{id}/components": { get: { tags: ["Salary"], summary: "List components" }, post: { tags: ["Salary"], summary: "Add component" } },
    "/salary-structures/assign": { post: { tags: ["Salary"], summary: "Assign salary to employee" } },
    "/salary-structures/employee/{empId}": { get: { tags: ["Salary"], summary: "Get employee salary" } },
    "/payroll": {
      get: { tags: ["Payroll"], summary: "List payroll runs" },
      post: { tags: ["Payroll"], summary: "Create payroll run", requestBody: { content: { "application/json": { schema: { type: "object", properties: { month: { type: "integer" }, year: { type: "integer" }, payDate: { type: "string", format: "date" } } } } } } },
    },
    "/payroll/{id}": { get: { tags: ["Payroll"], summary: "Get payroll run" } },
    "/payroll/{id}/compute": { post: { tags: ["Payroll"], summary: "Compute payroll (generates payslips)" } },
    "/payroll/{id}/approve": { post: { tags: ["Payroll"], summary: "Approve payroll run" } },
    "/payroll/{id}/pay": { post: { tags: ["Payroll"], summary: "Mark as paid" } },
    "/payroll/{id}/cancel": { post: { tags: ["Payroll"], summary: "Cancel payroll run" } },
    "/payroll/{id}/payslips": { get: { tags: ["Payroll"], summary: "List payslips for run" } },
    "/payroll/{id}/reports/bank-file": { get: { tags: ["Payroll"], summary: "Download bank transfer CSV" } },
    "/payslips": { get: { tags: ["Payslips"], summary: "List all payslips" } },
    "/payslips/{id}": { get: { tags: ["Payslips"], summary: "Get payslip" } },
    "/payslips/{id}/pdf": { get: { tags: ["Payslips"], summary: "Generate payslip PDF (HTML)" } },
    "/payslips/export/csv": { get: { tags: ["Payslips"], summary: "Export payslips CSV" } },
    "/payslips/employee/{empId}": { get: { tags: ["Payslips"], summary: "Employee payslip history" } },
    "/tax/computation/{empId}": { get: { tags: ["Tax"], summary: "Get tax computation" } },
    "/tax/computation/{empId}/compute": { post: { tags: ["Tax"], summary: "Compute tax" } },
    "/tax/declarations/{empId}": { get: { tags: ["Tax"], summary: "Get declarations" }, post: { tags: ["Tax"], summary: "Submit declarations" } },
    "/tax/regime/{empId}": { get: { tags: ["Tax"], summary: "Get tax regime" }, put: { tags: ["Tax"], summary: "Update tax regime" } },
    "/attendance/summary/{empId}": { get: { tags: ["Attendance"], summary: "Get attendance summary" } },
    "/attendance/import": { post: { tags: ["Attendance"], summary: "Import attendance records" } },
    "/organizations/{id}": { get: { tags: ["Organization"], summary: "Get organization" }, put: { tags: ["Organization"], summary: "Update organization" } },
    "/organizations/{id}/settings": { get: { tags: ["Organization"], summary: "Get settings" }, put: { tags: ["Organization"], summary: "Update settings" } },
    "/organizations/{id}/activity": { get: { tags: ["Organization"], summary: "Get audit log" } },
    "/self-service/dashboard": { get: { tags: ["Self-Service"], summary: "Employee dashboard" } },
    "/self-service/payslips": { get: { tags: ["Self-Service"], summary: "My payslips" } },
    "/self-service/salary": { get: { tags: ["Self-Service"], summary: "My salary" } },
    "/self-service/tax/computation": { get: { tags: ["Self-Service"], summary: "My tax computation" } },
    "/self-service/tax/declarations": { get: { tags: ["Self-Service"], summary: "My declarations" }, post: { tags: ["Self-Service"], summary: "Submit declaration" } },
    "/self-service/profile": { get: { tags: ["Self-Service"], summary: "My profile" } },
  },
};

export function apiDocsHandler(_req: Request, res: Response) {
  res.json(apiDoc);
}

export function swaggerUIHandler(_req: Request, res: Response) {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html><head><title>EMP Payroll API Docs</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head><body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({ url: '/api/v1/docs/openapi.json', dom_id: '#swagger-ui', deepLinking: true })</script>
</body></html>`);
}
