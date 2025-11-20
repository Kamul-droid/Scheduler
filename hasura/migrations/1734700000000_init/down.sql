-- Drop triggers
DROP TRIGGER IF EXISTS update_constraints_updated_at ON constraints;
DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS constraints;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS employees;

