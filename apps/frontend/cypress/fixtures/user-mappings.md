# Test Data User Mappings

This document describes the test data structure and how users (employees) map to the resource scheduling platform.

## Platform Context

The Resource Scheduler is designed for **healthcare/hospital workforce scheduling**, managing:
- Physicians
- Registered Nurses
- Nurse Practitioners
- Across multiple departments (ED, ICU, OR, Outpatient)

## Employee Role Mappings

### 1. Physicians
**Example**: Dr. Sarah Chen
- **Typical Departments**: Emergency Department, Intensive Care Unit
- **Required Skills**: Emergency Medicine, Trauma Care
- **Certifications**: ACLS, BLS, ATLS
- **Availability**: Rotating shifts, prefers day/evening
- **Hours**: Up to 50 hours/week
- **Constraints**: Avoid consecutive nights, 12-hour minimum rest

### 2. Registered Nurses (RN)
**Examples**: Michael Rodriguez, Emily Watson, Lisa Anderson, David Park, Robert Taylor, Jennifer Martinez

**Sub-types**:
- **Critical Care RN** (Michael, David)
  - Departments: ICU
  - Certifications: ACLS, BLS, CCRN
  - Specializations: Ventilator Management, Pediatric Care
  
- **Emergency RN** (Lisa)
  - Departments: Emergency Department
  - Certifications: ACLS, BLS, TNCC
  - Specializations: Triage, Emergency Response
  
- **Surgical RN** (Emily, Jennifer)
  - Departments: Operating Room
  - Certifications: BLS, CNOR
  - Specializations: Anesthesia Assistance, OR Coordination
  
- **General RN** (Robert)
  - Departments: Outpatient Clinic
  - Certifications: BLS
  - Experience Level: Entry (2 years)

### 3. Nurse Practitioners (NP)
**Example**: James Kim
- **Typical Departments**: Outpatient Clinic
- **Required Skills**: Primary Care, Chronic Disease Management
- **Certifications**: BLS, NP-C
- **Availability**: Standard business hours, weekdays only
- **Hours**: 40 hours/week

## Department Mappings

### Emergency Department
- **24/7 Coverage Required**
- **Min Staffing**: 3-5 per shift
- **Shift Types**: Day (12h), Evening (8h), Night (12h)
- **Required Certifications**: ACLS, BLS (minimum)
- **Typical Roles**: Physicians, Emergency RNs
- **Constraints**: High priority, critical coverage

### Intensive Care Unit (ICU)
- **24/7 Coverage Required**
- **Min Staffing**: 2-4 per shift
- **Shift Types**: Day (12h), Night (12h)
- **Required Certifications**: ACLS, BLS, CCRN
- **Typical Roles**: Critical Care RNs
- **Constraints**: Critical priority, requires experienced staff

### Operating Room
- **Business Hours Coverage**
- **Min Staffing**: 2-3 per shift
- **Shift Types**: Day (8h), Morning Block (8h)
- **Required Certifications**: BLS, CNOR
- **Typical Roles**: Surgical RNs
- **Constraints**: High priority, scheduled procedures

### Outpatient Clinic
- **Business Hours Coverage**
- **Min Staffing**: 2-4 per shift
- **Shift Types**: Day (8h)
- **Required Certifications**: BLS
- **Typical Roles**: NPs, General RNs
- **Constraints**: Medium priority, appointment-based

## Skill Structure

Skills are stored as JSONB with the following structure:
```json
{
  "name": "Emergency Medicine",
  "level": "expert|advanced|intermediate|beginner",
  "certifications": ["ACLS", "BLS", "ATLS"],
  "yearsExperience": 8
}
```

## Availability Pattern Structure

```json
{
  "type": "rotating|fixed|flexible|standard",
  "preferredShifts": ["day", "evening", "night"],
  "unavailableDays": ["saturday", "sunday"],
  "maxHoursPerWeek": 40,
  "minRestHours": 11
}
```

## Constraint Mappings

### Regulatory Constraints (Priority 90-100)
- **max_hours**: Legal work hour limits
- **min_rest**: Minimum rest between shifts (regulatory)
- **skill_requirement**: Certification requirements (regulatory)

### Operational Constraints (Priority 60-80)
- **fair_distribution**: Fair shift distribution
- **availability**: Respect employee preferences
- **max_consecutive_days**: Prevent burnout

## Test Scenarios

### Scenario 1: Emergency Coverage
- **Department**: Emergency Department
- **Shift**: Night (19:00-07:00)
- **Required**: 3 staff with ACLS/BLS
- **Employees**: Dr. Sarah Chen, Nurse Lisa Anderson
- **Constraint**: Min 11 hours rest after night shift

### Scenario 2: ICU Critical Care
- **Department**: Intensive Care Unit
- **Shift**: Day (07:00-19:00)
- **Required**: 2 staff with CCRN
- **Employees**: Nurse Michael Rodriguez, Nurse David Park
- **Constraint**: Must have ventilator management skills

### Scenario 3: OR Surgical Block
- **Department**: Operating Room
- **Shift**: Morning (06:00-14:00)
- **Required**: 2 staff with CNOR
- **Employees**: Nurse Emily Watson, Nurse Jennifer Martinez
- **Constraint**: Business hours only, no weekends

### Scenario 4: Clinic Appointment Day
- **Department**: Outpatient Clinic
- **Shift**: Day (08:00-17:00)
- **Required**: 2 staff with BLS
- **Employees**: NP James Kim, Nurse Robert Taylor
- **Constraint**: Weekdays only, standard hours

## Data Relationships

```
Department
  └──> Shifts (multiple shifts per department)
        └──> Required Skills
              └──> Employees (matched by skills)
                    └──> Schedules (employee assigned to shift)
                          └──> Constraints (validated against)
```

## Usage in Tests

1. **Seed Data**: Use `cy.seedTestData()` to populate database
2. **Create Employees**: Use department-specific employees for realistic scenarios
3. **Create Shifts**: Match shifts to departments with appropriate requirements
4. **Validate Constraints**: Test against regulatory and operational constraints
5. **Optimize**: Run optimization with realistic employee/shift/constraint combinations

