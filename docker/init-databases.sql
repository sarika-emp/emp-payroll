-- =============================================================================
-- EmpCloud: Initialize all databases in shared MySQL instance
-- This runs automatically on first MySQL startup
-- =============================================================================

-- App 1: EMP Payroll
CREATE DATABASE IF NOT EXISTS emp_payroll CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS empcloud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- App 2: EMP Billing
CREATE DATABASE IF NOT EXISTS emp_billing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- App 3: EMP LMS
CREATE DATABASE IF NOT EXISTS emp_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions (all apps use root for simplicity;
-- for production, create separate users per app)
-- CREATE USER IF NOT EXISTS 'payroll_user'@'%' IDENTIFIED BY 'payroll_pass';
-- GRANT ALL PRIVILEGES ON emp_payroll.* TO 'payroll_user'@'%';
-- GRANT ALL PRIVILEGES ON empcloud.* TO 'payroll_user'@'%';
--
-- CREATE USER IF NOT EXISTS 'billing_user'@'%' IDENTIFIED BY 'billing_pass';
-- GRANT ALL PRIVILEGES ON emp_billing.* TO 'billing_user'@'%';
--
-- CREATE USER IF NOT EXISTS 'lms_user'@'%' IDENTIFIED BY 'lms_pass';
-- GRANT ALL PRIVILEGES ON emp_lms.* TO 'lms_user'@'%';
--
-- FLUSH PRIVILEGES;
