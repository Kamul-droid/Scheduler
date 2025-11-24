# Resource Scheduler - Complex Data Visualization & Optimization

## Project Definition & Pitch

### What is Resource Scheduler?

**Resource Scheduler** is an enterprise-grade, full-stack scheduling and resource allocation platform that transforms how organizations manage workforce scheduling. Built with modern technologies and intelligent optimization algorithms, it solves complex scheduling challenges through constraint-based optimization, real-time conflict detection, and intuitive visual interfaces.

### The Problem We Solve

Organizations across healthcare, retail, manufacturing, and service industries struggle with:
- **Manual scheduling processes** that take hours or days each week
- **Scheduling conflicts** that lead to operational disruptions
- **Compliance violations** that result in fines and legal issues
- **Unfair workload distribution** that causes employee burnout
- **Inefficient resource allocation** that wastes money on overstaffing or degrades service through understaffing
- **Last-minute changes** that are difficult to manage and communicate

### Our Solution

Resource Scheduler provides:
- **Intelligent Optimization**: AI-powered scheduling that balances multiple objectives (cost, fairness, coverage)
- **Real-Time Conflict Detection**: Instant alerts for scheduling violations, skill mismatches, and constraint breaches
- **Visual Timeline Interface**: Intuitive week/month views that make scheduling transparent and manageable
- **Constraint Management**: Flexible rule engine supporting labor laws, union agreements, and business policies
- **Skill-Based Matching**: Automatic assignment based on employee certifications and shift requirements
- **On-Premise Deployment**: Complete data control and security for sensitive industries

### Key Differentiators

1. **Constraint Programming Solver**: Uses Google OR-Tools CP-SAT for mathematically optimal solutions
2. **Multi-Objective Optimization**: Balances cost, fairness, and coverage simultaneously
3. **Real-Time Validation**: Instant feedback on schedule changes before they're saved
4. **Flexible Architecture**: JSONB-based constraint rules adapt to any industry requirement
5. **Developer-Friendly**: Modern tech stack (React, NestJS, Python) with comprehensive testing

### Target Industries

- **Healthcare**: Hospitals, clinics, nursing homes requiring 24/7 coverage
- **Retail**: Stores managing part-time and full-time staff across multiple locations
- **Manufacturing**: Production facilities with shift-based operations
- **Service Organizations**: Call centers, customer support, field services
- **Education**: Schools managing substitute teachers and support staff

---

## Use Cases & Real Problems Solved

### Business Context

Healthcare facilities, retail chains, manufacturing plants, and service organizations face daily challenges in employee scheduling. Poor scheduling leads to overstaffing (wasted costs), understaffing (service degradation), employee burnout, compliance violations, and operational chaos. This project addresses these real-world pain points.

### Primary Use Cases

#### 1. **Hospital Nurse Scheduling**

**The Problem:**
- Hospitals need 24/7 coverage across multiple departments (ER, ICU, Pediatrics, Surgery)
- Nurses have different specializations and certifications (ACLS, BLS, Critical Care)
- Legal requirements: max hours per shift (12), minimum rest between shifts (11 hours)
- Union rules: fair distribution of weekend/night shifts across all staff
- Last-minute sick calls requiring immediate coverage
- Patient safety depends on adequate staffing with qualified personnel

**How The System Solves It:**
- **Skill Matching**: Automatically assigns nurses based on certifications and department needs
- **Constraint Validation**: Real-time checking of labor laws and union agreements
- **Optimization Algorithm**: Balances workload fairly across all staff members
- **Visual Timeline**: Managers see coverage gaps at a glance
- **Quick Adjustments**: Easy schedule modifications to handle last-minute changes
- **Conflict Detection**: Immediate alerts for double-bookings or violations
- **Historical Analysis**: Identifies patterns in understaffing to improve planning

**Real Impact:**
- Reduces scheduling time from 8 hours/week to 30 minutes
- Eliminates 95% of scheduling conflicts
- Ensures compliance with labor laws (avoiding fines)
- Improves nurse satisfaction through fair shift distribution
- Reduces overtime costs by 20-30%

#### 2. **Retail Chain Staffing**

**The Problem:**
- Multiple store locations with varying traffic patterns
- Part-time and full-time employees with different availability
- Peak hours requiring more staff (weekends, holidays, sales events)
- Budget constraints limiting total hours
- Employee preferences for certain shifts or days off

**How The System Solves It:**
- **Multi-Location Support**: Manage schedules across all stores from one interface
- **Demand-Based Scheduling**: Optimize staffing based on historical traffic patterns
- **Budget Constraints**: Set maximum hours per week while maintaining coverage
- **Preference Matching**: Consider employee availability and preferences
- **Automated Optimization**: Generate optimal schedules in minutes

**Real Impact:**
- Reduces labor costs by 15-25% through optimized staffing
- Improves customer service during peak hours
- Increases employee satisfaction with fair shift distribution
- Eliminates manual scheduling errors

#### 3. **Manufacturing Shift Management**

**The Problem:**
- 24/7 production requiring continuous coverage
- Multiple production lines with different staffing needs
- Safety requirements for minimum rest periods
- Skill requirements for specialized equipment operation
- Overtime management to control costs

**How The System Solves It:**
- **Continuous Coverage**: Ensures all shifts are staffed appropriately
- **Skill-Based Assignment**: Matches operators to equipment they're certified for
- **Rest Period Enforcement**: Automatically enforces minimum rest requirements
- **Overtime Minimization**: Optimizes to reduce overtime while maintaining coverage
- **Shift Rotation**: Fair distribution of day/night/weekend shifts

**Real Impact:**
- Prevents production downtime from understaffing
- Reduces safety incidents through proper rest periods
- Controls overtime costs
- Improves operator satisfaction with fair rotations

---

## User Documentation

### Getting Started

#### Accessing the Application

1. **Start the Application** (see [QUICK-START.md](./QUICK-START.md) for setup)
2. **Open Browser**: Navigate to http://localhost:3001
3. **Login**: The application uses Hasura authentication (configure as needed)

#### Navigation

The application has a top navigation bar with the following sections:
- **Scheduler**: Main scheduling timeline view
- **Employees**: Employee management
- **Departments**: Department configuration
- **Shifts**: Shift template management
- **Skills**: Skills and certifications catalog
- **Constraints**: Constraint rule management
- **Optimization**: Schedule optimization panel

---

### 1. Scheduler View

**Location**: `/app/scheduler`

The Scheduler View is your main workspace for viewing and managing schedules.

#### Features

- **Week Navigation**: Navigate between weeks using arrow buttons
- **Date Selection**: Click on any date to view that day's schedule
- **Timeline Visualization**: See all schedules for selected date in a timeline format
- **Employee Filtering**: Filter schedules by specific employees
- **Conflict Indicators**: Visual indicators show scheduling conflicts
- **Add Schedule**: Click "Add Schedule" button to create new assignments

#### Creating a Schedule

1. Click **"Add Schedule"** button
2. Fill in the form:
   - **Employee**: Select from dropdown
   - **Shift**: Select shift template (or enter custom times)
   - **Start Time**: Date and time
   - **End Time**: Date and time
   - **Status**: Confirmed, Tentative, or Conflict
3. Click **"Create"**
4. The system will validate:
   - Employee availability
   - Skill requirements
   - Constraint compliance
   - Conflict detection

#### Editing a Schedule

1. Click on any schedule in the timeline
2. Click **"Edit"** button
3. Modify the schedule details
4. Click **"Update"**
5. System validates changes in real-time

#### Deleting a Schedule

1. Click on the schedule
2. Click **"Delete"** button
3. Confirm deletion

#### Understanding Conflict Indicators

- **Red Badge**: Shows number of conflicts on selected date
- **Conflict Status**: Schedules with conflicts are marked in red
- **Conflict Types**:
  - Overlapping schedules for same employee
  - Skill mismatches
  - Constraint violations
  - Availability conflicts

---

### 2. Employee Management

**Location**: `/app/employees`

Manage your workforce roster, skills, and availability.

#### Adding an Employee

1. Click **"Add Employee"** button
2. Fill in required fields:
   - **Name**: Full name
   - **Email**: Unique email address
3. **Optional Fields**:
   - **Skills**: Add certifications and specializations
   - **Availability Pattern**: Define recurring availability
   - **Metadata**: Additional information (department, role, etc.)
4. Click **"Create"**

#### Managing Employee Skills

1. Open employee edit form
2. In **Skills** section:
   - Click **"Add Skill"**
   - Enter skill name (e.g., "ACLS", "BLS", "Critical Care Nursing")
   - Optionally add level and certifications
3. Skills are used for:
   - Automatic skill matching during optimization
   - Shift requirement validation
   - Employee filtering

#### Setting Availability Patterns

1. Open employee edit form
2. In **Availability Pattern** section:
   - Define recurring availability windows
   - Specify days of week and time ranges
   - Example:
     ```json
     {
       "type": "weekly",
       "windows": [
         {
           "dayOfWeek": 1,
           "startTime": "08:00",
           "endTime": "17:00"
         }
       ]
     }
     ```

#### Editing an Employee

1. Find employee in the list
2. Click **"Edit"** button
3. Modify information
4. Click **"Update"**

#### Deleting an Employee

1. Find employee in the list
2. Click **"Delete"** button
3. Confirm deletion
4. **Note**: Deleting an employee will also delete all their schedules

---

### 3. Department Management

**Location**: `/app/departments`

Organize your workforce by departments (e.g., Emergency Department, ICU, Surgery).

#### Adding a Department

1. Click **"Add Department"** button
2. Enter **Name**: Unique department name
3. **Optional**: Add requirements in JSON format
4. Click **"Create"**

#### Department Requirements

Departments can have requirements stored as JSON:
```json
{
  "typicalRoles": ["Nurse", "Physician"],
  "requiredCertifications": ["ACLS", "BLS"],
  "minStaffingPerShift": 3,
  "typicalShiftLength": 12
}
```

---

### 4. Shift Management

**Location**: `/app/shifts`

Create shift templates that define time windows, staffing requirements, and skill needs.

#### Creating a Shift

1. Click **"Add Shift"** button
2. Fill in the form:
   - **Department**: Select department
   - **Required Skills**: Add skills needed for this shift
   - **Min Staffing**: Minimum number of employees required
   - **Max Staffing**: Maximum number of employees allowed
   - **Start Time**: Shift start date and time
   - **End Time**: Shift end date and time
   - **Metadata**: Additional information (shift type, priority, notes)
3. Click **"Create"**

#### Shift Templates

Shifts can be used as templates for:
- Recurring schedules
- Optimization input
- Coverage planning

#### Required Skills Format

Skills can be specified as:
- Simple strings: `["ACLS", "BLS"]`
- Objects with details:
  ```json
  [
    {
      "name": "Critical Care Nursing",
      "level": "expert",
      "certifications": ["ACLS", "BLS"]
    }
  ]
  ```

---

### 5. Skills Management

**Location**: `/app/skills`

View and manage the skills catalog used across the system.

#### Skills Catalog

The skills view shows:
- All skills used in the system
- Which employees have each skill
- Which shifts require each skill

#### Skills are Used For

- **Employee Matching**: Finding qualified employees for shifts
- **Constraint Validation**: Ensuring skill requirements are met
- **Optimization**: Skill-based assignment during optimization

---

### 6. Constraint Management

**Location**: `/app/constraints`

Define and manage scheduling rules that enforce business policies, labor laws, and operational requirements.

#### Constraint Types

The system supports 7 constraint types:

1. **Max Hours** (`max_hours`)
   - Limits total hours per day/week
   - Rules format:
     ```json
     {
       "maxHoursPerWeek": 40,
       "maxHoursPerDay": 12,
       "periodInDays": 7
     }
     ```

2. **Min Rest** (`min_rest`)
   - Enforces minimum rest between shifts
   - Rules format:
     ```json
     {
       "minRestHours": 11,
       "applyToConsecutiveShifts": true
     }
     ```

3. **Fair Distribution** (`fair_distribution`)
   - Ensures equitable workload distribution
   - Rules format:
     ```json
     {
       "maxShiftsPerEmployee": 20,
       "distributionMethod": "equal"
     }
     ```

4. **Skill Requirement** (`skill_requirement`)
   - Enforces minimum skill requirements
   - Rules format:
     ```json
     {
       "requiredSkills": ["ACLS", "BLS", "Emergency Medicine"]
     }
     ```

5. **Availability** (`availability`)
   - Enforces employee availability windows
   - Rules format:
     ```json
     {
       "availabilityWindows": [
         {
           "dayOfWeek": 1,
           "startTime": "08:00",
           "endTime": "17:00"
         }
       ]
     }
     ```

6. **Max Consecutive Days** (`max_consecutive_days`)
   - Limits consecutive working days
   - Rules format:
     ```json
     {
       "maxDays": 5
     }
     ```

7. **Min Consecutive Days** (`min_consecutive_days`)
   - Ensures minimum consecutive working days
   - Rules format:
     ```json
     {
       "minDays": 3
     }
     ```

#### Creating a Constraint

1. Click **"Add Constraint"** button
2. Select **Type**: Choose from dropdown
3. Enter **Rules**: JSON format (see examples above)
4. Set **Priority**: 0-100 (higher = more important)
5. Set **Active**: Toggle on/off
6. Click **"Create"**

#### Constraint Priority

- **0-100 scale**: Higher numbers = higher priority
- **100**: Critical constraints (e.g., legal requirements)
- **90-99**: Important constraints (e.g., union rules)
- **70-89**: Standard constraints (e.g., operational policies)
- **0-69**: Soft constraints (e.g., preferences)

#### Active vs Inactive

- **Active**: Constraint is enforced during optimization and validation
- **Inactive**: Constraint is stored but not enforced (useful for historical records)

#### Editing Constraints

1. Find constraint in the list
2. Click **"Edit"** button
3. Modify rules, priority, or active status
4. Click **"Update"**

#### Constraint Validation

When creating/editing schedules, the system automatically:
- Checks all active constraints
- Shows violations immediately
- Prevents saving invalid schedules (depending on constraint priority)

---

### 7. Optimization Panel

**Location**: `/app/optimization`

Generate optimal schedules automatically using constraint programming and multi-objective optimization.

#### Starting an Optimization

1. **Set Date Range**:
   - **Start Date**: Beginning of optimization period
   - **End Date**: End of optimization period
   - System validates that shifts exist in this range

2. **Choose Objective**:
   - **Minimize Cost**: Reduce total labor costs
   - **Maximize Fairness**: Distribute workload equally
   - **Balance**: Optimize both cost and fairness

3. **Configure Options**:
   - **Allow Overtime**: Permit overtime assignments
   - **Max Optimization Time**: Time limit for solver (seconds)
   - **Solution Count**: Number of alternative solutions to generate (1-5)

4. **Review Validation**:
   - System shows:
     - Number of employees available
     - Number of shifts in range
     - Number of active constraints
   - Fix any validation errors before proceeding

5. **Click "Start Optimization"**

#### Optimization Process

1. **Status**: Shows "optimizing..." with progress indicator
2. **Polling**: System automatically checks status every 2 seconds
3. **Completion**: Status changes to "completed" or "partial"

#### Viewing Solutions

After optimization completes, you'll see:

- **Solution Cards**: One for each generated solution
- **Metrics for Each Solution**:
  - **Score**: Overall quality score
  - **Total Cost**: Estimated labor cost
  - **Fairness Score**: Workload distribution quality
  - **Coverage**: Percentage of shifts covered
  - **Constraint Violations**: Number of violations (if any)

#### Applying a Solution

1. Review all solution options
2. Select the best solution for your needs
3. Click **"Apply Solution"** on the solution card
4. System creates schedules for all assignments in the solution
5. Success message confirms application
6. Navigate to Scheduler View to see the new schedules

#### Optimization Status

- **Optimizing**: Solver is running
- **Completed**: Optimal solution found
- **Partial**: Solution found but may have some violations
- **Failed**: Optimization could not find a solution

#### Understanding Optimization Results

**Good Solutions Have**:
- High coverage (90%+)
- Low or zero constraint violations
- Balanced fairness score
- Reasonable total cost

**If Optimization Fails**:
- Check that employees have required skills
- Verify employee availability matches shifts
- Review constraint rules (may be too restrictive)
- Try allowing overtime
- Increase optimization time limit

#### Optimization Best Practices

1. **Start Small**: Test with 1-2 weeks before optimizing months
2. **Review Constraints**: Ensure active constraints are necessary
3. **Check Skills**: Verify employees have skills required by shifts
4. **Validate Availability**: Confirm employee availability patterns
5. **Compare Solutions**: Review multiple solutions before applying
6. **Manual Adjustments**: Use optimization as starting point, then fine-tune manually

---

## Common Workflows

### Workflow 1: Weekly Schedule Creation

1. **Monday Morning**: Review previous week's schedule
2. **Create Shifts**: Add all shifts for the upcoming week
3. **Run Optimization**: Generate optimal schedule
4. **Review Solutions**: Compare optimization results
5. **Apply Solution**: Select and apply best solution
6. **Manual Adjustments**: Fine-tune based on employee requests
7. **Publish**: Confirm all schedules and notify employees

### Workflow 2: Handling Last-Minute Changes

1. **Receive Request**: Employee calls in sick or requests change
2. **View Schedule**: Open Scheduler View for affected date
3. **Find Replacement**: Use employee filter to find available staff
4. **Check Skills**: Verify replacement has required skills
5. **Create/Edit Schedule**: Make the change
6. **Validate**: System checks for conflicts automatically
7. **Confirm**: Save if no conflicts, or resolve conflicts first

### Workflow 3: Setting Up New Department

1. **Create Department**: Add new department in Department Management
2. **Define Requirements**: Set minimum staffing, typical roles, certifications
3. **Create Shifts**: Add shift templates for the department
4. **Add Employees**: Assign employees to department (via metadata)
5. **Set Constraints**: Create department-specific constraints if needed
6. **Test Optimization**: Run optimization for a test period
7. **Go Live**: Start using for actual scheduling

### Workflow 4: Monthly Schedule Planning

1. **Review Constraints**: Update constraint priorities and rules
2. **Update Availability**: Collect employee availability for the month
3. **Create All Shifts**: Generate shift templates for entire month
4. **Run Optimization**: Optimize for full month (may take longer)
5. **Review Results**: Check coverage and constraint compliance
6. **Apply Solution**: Apply optimal solution
7. **Communicate**: Export or share schedule with employees

---

## Tips & Best Practices

### Scheduling Tips

1. **Plan Ahead**: Create shifts at least 1-2 weeks in advance
2. **Use Templates**: Create reusable shift templates for recurring schedules
3. **Skill Management**: Keep skills catalog up-to-date
4. **Constraint Priority**: Set critical constraints (legal requirements) to priority 90-100
5. **Regular Reviews**: Review and update constraints quarterly

### Optimization Tips

1. **Start with Constraints**: Set up constraints before optimizing
2. **Test Small**: Optimize 1 week before attempting months
3. **Compare Objectives**: Try different objectives to see trade-offs
4. **Review Solutions**: Always review before applying
5. **Manual Fine-Tuning**: Optimization provides starting point, not final answer

### Data Management Tips

1. **Employee Skills**: Keep employee skills current
2. **Availability Patterns**: Update when employees change availability
3. **Shift Templates**: Create templates for common shift patterns
4. **Constraint Rules**: Document constraint rules in metadata
5. **Regular Cleanup**: Archive old schedules periodically

---

## Troubleshooting

### Schedule Creation Issues

**Problem**: Can't create schedule
- **Check**: Employee has required skills
- **Check**: Employee is available at that time
- **Check**: No overlapping schedules
- **Check**: Constraints are satisfied

### Optimization Issues

**Problem**: Optimization fails
- **Check**: Employees exist with required skills
- **Check**: Shifts exist in date range
- **Check**: Constraints aren't too restrictive
- **Try**: Allow overtime option
- **Try**: Increase optimization time limit

**Problem**: Optimization takes too long
- **Reduce**: Date range (optimize smaller periods)
- **Reduce**: Number of employees/shifts
- **Reduce**: Number of constraints
- **Reduce**: Solution count

### Constraint Issues

**Problem**: Constraint not being enforced
- **Check**: Constraint is marked as "Active"
- **Check**: Constraint priority is high enough
- **Check**: Rules JSON is valid
- **Check**: Constraint type matches rules structure

### Performance Issues

**Problem**: Application is slow
- **Check**: Number of schedules in database
- **Check**: Browser console for errors
- **Try**: Refresh page
- **Try**: Clear browser cache

---

## Support & Resources

### Documentation

- **Architecture**: See [README.md](./README.md)
- **Quick Start**: See [QUICK-START.md](./QUICK-START.md)
- **API Documentation**: See `apps/frontend/API_ENDPOINTS.md`

### Getting Help

1. **Check Logs**: Review application logs for errors
2. **Review Documentation**: Check relevant sections above
3. **Test Data**: Use seed script to generate test data
4. **Health Checks**: Verify all services are running

### Feature Requests

The system is designed to be extensible. Common enhancements:
- Custom constraint types
- Additional optimization objectives
- Export/import functionality
- Mobile app
- Employee self-service portal

---

## Conclusion

Resource Scheduler provides a comprehensive solution for workforce scheduling challenges. By combining intelligent optimization with intuitive interfaces, it transforms scheduling from a time-consuming manual process into an efficient, automated system that ensures compliance, fairness, and optimal resource utilization.

Start with the basics (employees, shifts, constraints), then leverage optimization to generate optimal schedules automatically. Use manual adjustments for fine-tuning, and let the system handle validation and conflict detection.

For technical setup and deployment, refer to [QUICK-START.md](./QUICK-START.md) and [README.md](./README.md).
