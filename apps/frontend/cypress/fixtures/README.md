# Test Data Fixtures

This directory contains test data fixtures that map to the Resource Scheduler platform description.

## File Structure

- `test-data.json` - Comprehensive test data with user mappings
- `user-mappings.md` - Documentation of user role and department mappings

## Test Data Structure

### Employees
The test data includes 8 employees representing different roles:
- **1 Physician** (Dr. Sarah Chen) - Emergency Department
- **6 Registered Nurses** with various specializations:
  - Critical Care (Michael Rodriguez, David Park)
  - Emergency (Lisa Anderson)
  - Surgical (Emily Watson, Jennifer Martinez)
  - General (Robert Taylor)
- **1 Nurse Practitioner** (James Kim) - Outpatient Clinic

### Departments
4 departments representing different healthcare areas:
- Emergency Department (24/7 coverage)
- Intensive Care Unit (24/7 coverage)
- Operating Room (business hours)
- Outpatient Clinic (business hours)

### Skills Structure
Skills are stored as JSONB with:
```json
{
  "name": "Emergency Medicine",
  "level": "expert|advanced|intermediate|beginner",
  "certifications": ["ACLS", "BLS", "ATLS"],
  "yearsExperience": 8
}
```

### Availability Patterns
```json
{
  "type": "rotating|fixed|flexible|standard",
  "preferredShifts": ["day", "evening", "night"],
  "unavailableDays": ["saturday", "sunday"],
  "maxHoursPerWeek": 40,
  "minRestHours": 11
}
```

### Constraints
6 constraint types covering:
- Regulatory (max_hours, min_rest, skill_requirement)
- Operational (fair_distribution, availability, max_consecutive_days)

## User Mappings

The `userMappings` section in `test-data.json` defines:
- **Role mappings**: Typical departments, skills, certifications per role
- **Department mappings**: Required roles, certifications, staffing needs
- **Shift type mappings**: Hours, length, preferences

## Usage

### In Cypress Tests
```typescript
// Use comprehensive platform data
cy.seedPlatformData();

// Or use simplified test data
cy.seedTestData();

// Create specific role
cy.createEmployeeByRole('physician');

// Create shift for department
cy.createShiftForDepartment('Emergency Department');
```

### Direct Import
```typescript
import testData from '../fixtures/test-data.json';

// Access user mappings
const physicianRole = testData.userMappings.roles.physician;
const edDepartment = testData.userMappings.departments['Emergency Department'];
```

## Data Relationships

```
Department (Emergency Department)
  └──> Requires: ACLS, BLS certifications
  └──> Shifts: Day (07:00-19:00), Night (19:00-07:00)
        └──> Requires: 3-5 staff with ACLS/BLS
              └──> Employees: Dr. Sarah Chen, Nurse Lisa Anderson
                    └──> Skills: Emergency Medicine, Triage
                          └──> Certifications: ACLS, BLS, ATLS, TNCC
```

## Real-World Scenarios

### Scenario: Emergency Night Coverage
- **Department**: Emergency Department
- **Shift**: Night (19:00-07:00)
- **Required**: 3 staff minimum
- **Certifications**: ACLS, BLS
- **Available Employees**: 
  - Dr. Sarah Chen (if available)
  - Nurse Lisa Anderson (rotating, all shifts)
- **Constraints**: 
  - Min 11 hours rest after night shift
  - Max 40 hours/week
  - Must have required certifications

### Scenario: ICU Critical Patient Care
- **Department**: Intensive Care Unit
- **Shift**: Day (07:00-19:00)
- **Required**: 2 staff minimum
- **Certifications**: ACLS, BLS, CCRN
- **Available Employees**:
  - Nurse Michael Rodriguez (night preference, but flexible)
  - Nurse David Park (day/evening preference)
- **Constraints**:
  - Must have CCRN certification
  - Ventilator management skills preferred

## Extending Test Data

To add new test data:

1. **Add Employee**: Add to `employees` array with appropriate skills and availability
2. **Add Department**: Add to `departments` array with requirements
3. **Add Shift**: Add to `shifts` array, link to department
4. **Update Mappings**: Update `userMappings` section to reflect new data

## Validation

Test data should:
- ✅ Match platform domain (healthcare/hospital)
- ✅ Include realistic skills and certifications
- ✅ Have proper availability patterns
- ✅ Map to appropriate departments
- ✅ Respect constraint rules
- ✅ Support optimization scenarios

