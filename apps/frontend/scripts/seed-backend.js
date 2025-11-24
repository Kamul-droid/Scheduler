/* eslint-env node */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3000';
const TEST_DATA_PATH = path.join(__dirname, '../cypress/fixtures/test-data.json');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findEntityByName(apiEndpoint, nameField, nameValue) {
  try {
    const response = await axios.get(`${API_BASE}${apiEndpoint}`);
    const entities = Array.isArray(response.data) ? response.data : response.data.data || [];
    return entities.find((entity) => entity[nameField] === nameValue);
  } catch (error) {
    return null;
  }
}

async function findEntityByType(apiEndpoint, typeField, typeValue) {
  try {
    const response = await axios.get(`${API_BASE}${apiEndpoint}`);
    const entities = Array.isArray(response.data) ? response.data : response.data.data || [];
    return entities.find((entity) => entity[typeField] === typeValue);
  } catch (error) {
    return null;
  }
}

/**
 * Fetches existing valid schedules from the database
 * Validates that schedules have valid employee and shift references
 */
async function fetchValidSchedules() {
  try {
    console.log('📋 Fetching existing valid schedules from database...');
    const response = await axios.get(`${API_BASE}/schedules`);
    const schedules = Array.isArray(response.data) ? response.data : response.data.data || [];
    
    // Fetch employees and shifts to validate references
    const [employeesResponse, shiftsResponse] = await Promise.all([
      axios.get(`${API_BASE}/employees`).catch(() => ({ data: [] })),
      axios.get(`${API_BASE}/shifts`).catch(() => ({ data: [] })),
    ]);
    
    const employees = Array.isArray(employeesResponse.data) 
      ? employeesResponse.data 
      : employeesResponse.data.data || [];
    const shifts = Array.isArray(shiftsResponse.data) 
      ? shiftsResponse.data 
      : shiftsResponse.data.data || [];
    
    const employeeIds = new Set(employees.map(e => e.id));
    const shiftIds = new Set(shifts.map(s => s.id));
    
    // Filter to only valid schedules (with valid employee and shift references)
    const validSchedules = schedules.filter(schedule => {
      const hasValidEmployee = schedule.employeeId && employeeIds.has(schedule.employeeId);
      const hasValidShift = schedule.shiftId && shiftIds.has(schedule.shiftId);
      return hasValidEmployee && hasValidShift;
    });
    
    console.log(`   ✅ Found ${validSchedules.length} valid schedules (out of ${schedules.length} total)`);
    
    // Convert to seed format (without IDs, will be matched by employee/shift)
    return validSchedules.map(schedule => ({
      employeeId: schedule.employeeId,
      shiftId: schedule.shiftId,
      startTime: schedule.startTime || schedule.start_time,
      endTime: schedule.endTime || schedule.end_time,
      status: schedule.status || 'confirmed',
      metadata: schedule.metadata || {},
    }));
  } catch (error) {
    console.error(`   ⚠ Failed to fetch schedules: ${error.message}`);
    return [];
  }
}

async function waitForBackend(maxRetries = 30, retryDelay = 2000) {
  console.log(`⏳ Waiting for backend to be available at ${API_BASE}...`);
  for (let i = 0; i < maxRetries; i++) {
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
      console.log(`✅ Backend is available (${healthResponse.status} ${healthResponse.statusText})\n`);
      return true;
    } catch (error) {
      if (i < maxRetries - 1) {
        console.log(`   Attempt ${i + 1}/${maxRetries}: Backend not ready, retrying in ${retryDelay / 1000}s...`);
        await wait(retryDelay);
      } else {
        console.error('❌ Backend is not available after maximum retries.');
        console.error(`   Expected backend at: ${API_BASE}`);
        if (error.code === 'ECONNREFUSED') {
          console.error('   Error: Connection refused - backend is not running\n');
        } else if (error.code === 'ETIMEDOUT') {
          console.error('   Error: Connection timeout - backend is not responding\n');
        } else {
          console.error(`   Error: ${error.message}\n`);
        }
        // In standalone mode, exit with error. Otherwise, just log and continue.
        if (process.env.SEED_BACKEND_STANDALONE === 'true') {
          process.exit(1);
        }
        return false;
      }
    }
  }
  return false;
}

async function seedBackend() {
  console.log('🌱 Seeding backend with test data...\n');

  // Wait for backend to be available with retries
  const backendReady = await waitForBackend(30, 2000);
  if (!backendReady) {
    console.error('⚠️  Skipping seed - backend is not available.\n');
    return;
  }

  // Load test data from fixture file
  console.log('⏳ Loading test data from fixture file...');
  console.log(`   Looking for fixture at: ${TEST_DATA_PATH}`);
  
  // Check if fixture file exists
  if (!fs.existsSync(TEST_DATA_PATH)) {
    console.error(`❌ Fixture file not found: ${TEST_DATA_PATH}`);
    console.error('   Please ensure the fixture file exists in cypress/fixtures/test-data.json');
    if (process.env.SEED_BACKEND_STANDALONE === 'true') {
      console.error('   Exiting because SEED_BACKEND_STANDALONE=true\n');
      process.exit(1);
    } else {
      console.error('   Continuing anyway (not in standalone mode)\n');
      return;
    }
  }
  
  let testData;
  try {
    const data = fs.readFileSync(TEST_DATA_PATH, 'utf-8');
    testData = JSON.parse(data);
    console.log(`✅ Loaded test data from: ${TEST_DATA_PATH}`);
    console.log(`   - ${testData.departments?.length || 0} departments`);
    console.log(`   - ${testData.employees?.length || 0} employees`);
    console.log(`   - ${testData.constraints?.length || 0} constraints`);
    console.log(`   - ${testData.shifts?.length || 0} shifts`);
    console.log(`   - ${testData.schedules?.length || 0} schedules\n`);
    
    // Validate that we have data to seed
    if (!testData.departments || testData.departments.length === 0) {
      console.warn('⚠️  Warning: No departments found in fixture data');
    }
    if (!testData.employees || testData.employees.length === 0) {
      console.warn('⚠️  Warning: No employees found in fixture data');
    }
  } catch (error) {
    console.error('❌ Failed to load test data:', error.message);
    console.error(`   Path: ${TEST_DATA_PATH}`);
    if (error.code === 'ENOENT') {
      console.error('   Error: File not found');
    } else if (error instanceof SyntaxError) {
      console.error('   Error: Invalid JSON format');
    }
    if (process.env.SEED_BACKEND_STANDALONE === 'true') {
      console.error('   Exiting because SEED_BACKEND_STANDALONE=true\n');
      process.exit(1);
    } else {
      console.error('   Continuing anyway (not in standalone mode)\n');
      return;
    }
  }

  const createdData = {
    departments: [],
    employees: [],
    shifts: [],
    constraints: [],
    schedules: [],
  };

  try {
    // 1. Create Departments
    console.log('📁 Processing departments...');
    for (let i = 0; i < testData.departments.length; i++) {
      const dept = testData.departments[i];
      console.log(`   [${i + 1}/${testData.departments.length}] Processing: ${dept.name}...`);
      
      try {
        console.log(`      ⏳ POST ${API_BASE}/departments`);
        const response = await axios.post(`${API_BASE}/departments`, dept, {
          validateStatus: (status) => status < 500, // Don't throw on 4xx
        });
        
        if (response.status === 201 || response.status === 200) {
          createdData.departments.push(response.data);
          console.log(`      ✅ Created (${response.status}): ${dept.name} [ID: ${response.data.id}]`);
        } else if (response.status === 409 || response.status === 400) {
          // Entity already exists, try to fetch it
          const errorMsg = response.data?.message || JSON.stringify(response.data);
          if (errorMsg.includes('duplicate') || errorMsg.includes('unique constraint') || errorMsg.includes('already exists')) {
            console.log(`      ⚠ Already exists (${response.status}), fetching existing entity...`);
            const existing = await findEntityByName('/departments', 'name', dept.name);
            if (existing) {
              createdData.departments.push(existing);
              console.log(`      ✅ Found existing: ${dept.name} [ID: ${existing.id}]`);
            } else {
              console.log(`      ⚠ Could not fetch existing entity, skipping`);
            }
          } else {
            console.error(`      ❌ Failed (${response.status}): ${errorMsg}`);
          }
        } else {
          console.error(`      ❌ Failed (${response.status}): ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        // Check if it's a uniqueness violation
        const errorMsg = error.response?.data?.message || error.message || '';
        if (error.response?.status === 400 && (
          errorMsg.includes('duplicate') || 
          errorMsg.includes('unique constraint') || 
          errorMsg.includes('departments_name_key') ||
          errorMsg.includes('already exists')
        )) {
          console.log(`      ⚠ Already exists, fetching existing entity...`);
          const existing = await findEntityByName('/departments', 'name', dept.name);
          if (existing) {
            createdData.departments.push(existing);
            console.log(`      ✅ Found existing: ${dept.name} [ID: ${existing.id}]`);
          } else {
            console.log(`      ⚠ Could not fetch existing entity, skipping`);
          }
        } else {
          if (error.response) {
            console.error(`      ❌ Error (${error.response.status}): ${errorMsg}`);
          } else if (error.request) {
            console.error(`      ❌ Network error: No response received`);
          } else {
            console.error(`      ❌ Error: ${error.message}`);
          }
        }
      }
      await wait(200); // Small delay between requests
    }
    console.log(`   ✅ Processed ${testData.departments.length} departments (${createdData.departments.length} available)\n`);
    await wait(500);

    // 2. Create Employees
    console.log('👥 Processing employees...');
    for (let i = 0; i < testData.employees.length; i++) {
      const emp = testData.employees[i];
      console.log(`   [${i + 1}/${testData.employees.length}] Processing: ${emp.name}...`);
      
      try {
        console.log(`      ⏳ POST ${API_BASE}/employees`);
        const response = await axios.post(`${API_BASE}/employees`, emp, {
          validateStatus: (status) => status < 500,
        });
        
        if (response.status === 201 || response.status === 200) {
          createdData.employees.push(response.data);
          console.log(`      ✅ Created (${response.status}): ${emp.name} [ID: ${response.data.id}]`);
        } else if (response.status === 409 || response.status === 400) {
          const errorMsg = response.data?.message || JSON.stringify(response.data);
          if (errorMsg.includes('duplicate') || errorMsg.includes('unique constraint') || errorMsg.includes('already exists')) {
            console.log(`      ⚠ Already exists (${response.status}), fetching existing entity...`);
            const existing = await findEntityByName('/employees', 'name', emp.name);
            if (existing) {
              createdData.employees.push(existing);
              console.log(`      ✅ Found existing: ${emp.name} [ID: ${existing.id}]`);
            } else {
              console.log(`      ⚠ Could not fetch existing entity, skipping`);
            }
          } else {
            console.error(`      ❌ Failed (${response.status}): ${errorMsg}`);
          }
        } else {
          console.error(`      ❌ Failed (${response.status}): ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message || '';
        if (error.response?.status === 400 && (
          errorMsg.includes('duplicate') || 
          errorMsg.includes('unique constraint') || 
          errorMsg.includes('employees_email_key') ||
          errorMsg.includes('already exists')
        )) {
          console.log(`      ⚠ Already exists, fetching existing entity...`);
          const existing = await findEntityByName('/employees', 'name', emp.name);
          if (existing) {
            createdData.employees.push(existing);
            console.log(`      ✅ Found existing: ${emp.name} [ID: ${existing.id}]`);
          } else {
            console.log(`      ⚠ Could not fetch existing entity, skipping`);
          }
        } else {
          if (error.response) {
            console.error(`      ❌ Error (${error.response.status}): ${errorMsg}`);
          } else if (error.request) {
            console.error(`      ❌ Network error: No response received`);
          } else {
            console.error(`      ❌ Error: ${error.message}`);
          }
        }
      }
      await wait(200);
    }
    console.log(`   ✅ Processed ${testData.employees.length} employees (${createdData.employees.length} available)\n`);
    
    // Create additional employees to match shift requirements and constraints
    // These employees will have the skills needed for the generated shifts
    console.log('👥 Creating additional employees to match shift requirements...');
    
    // Define employee templates that match the shift requirements
    // Note: Constraint requires skills named: "ACLS", "BLS", "Emergency Medicine", "Critical Care"
    const employeeTemplates = [
      // Emergency Department employees (need Emergency Medicine, ACLS, BLS, Critical Care)
      {
        name: 'Nurse Alex Thompson',
        email: 'alex.thompson@hospital.com',
        skills: [
          { name: 'Emergency Medicine', level: 'advanced', certifications: ['ACLS', 'BLS'], yearsExperience: 4 },
          { name: 'ACLS', level: 'expert', certifications: ['ACLS'], yearsExperience: 4 },
          { name: 'BLS', level: 'expert', certifications: ['BLS'], yearsExperience: 4 },
          { name: 'Critical Care', level: 'intermediate', certifications: ['ACLS', 'BLS'], yearsExperience: 4 },
          { name: 'Trauma Care', level: 'intermediate', certifications: ['ACLS', 'BLS'], yearsExperience: 4 },
        ],
        availabilityPattern: {
          type: 'rotating',
          preferredShifts: ['day', 'night'],
          unavailableDays: [],
          maxHoursPerWeek: 40,
          minRestHours: 11,
        },
        metadata: {
          role: 'Registered Nurse',
          department: 'Emergency Department',
          employeeType: 'full_time',
        },
      },
      {
        name: 'Nurse Jessica Lee',
        email: 'jessica.lee@hospital.com',
        skills: [
          { name: 'Emergency Medicine', level: 'advanced', certifications: ['ACLS', 'BLS'], yearsExperience: 5 },
          { name: 'ACLS', level: 'expert', certifications: ['ACLS'], yearsExperience: 5 },
          { name: 'BLS', level: 'expert', certifications: ['BLS'], yearsExperience: 5 },
          { name: 'Critical Care', level: 'intermediate', certifications: ['ACLS', 'BLS'], yearsExperience: 5 },
          { name: 'Emergency Nursing', level: 'advanced', certifications: ['ACLS', 'BLS', 'TNCC'], yearsExperience: 5 },
        ],
        availabilityPattern: {
          type: 'flexible',
          preferredShifts: ['day', 'evening'],
          unavailableDays: ['sunday'],
          maxHoursPerWeek: 36,
          minRestHours: 10,
        },
        metadata: {
          role: 'Registered Nurse',
          department: 'Emergency Department',
          employeeType: 'full_time',
        },
      },
      // ICU employees (need Critical Care Nursing, ACLS, BLS, CCRN, Critical Care)
      {
        name: 'Nurse Maria Garcia',
        email: 'maria.garcia@hospital.com',
        skills: [
          { name: 'Critical Care Nursing', level: 'expert', certifications: ['ACLS', 'BLS', 'CCRN'], yearsExperience: 6 },
          { name: 'Critical Care', level: 'expert', certifications: ['ACLS', 'BLS', 'CCRN'], yearsExperience: 6 },
          { name: 'ACLS', level: 'expert', certifications: ['ACLS'], yearsExperience: 6 },
          { name: 'BLS', level: 'expert', certifications: ['BLS'], yearsExperience: 6 },
          { name: 'Emergency Medicine', level: 'advanced', certifications: ['ACLS', 'BLS'], yearsExperience: 6 },
          { name: 'Ventilator Management', level: 'advanced', certifications: ['CCRN'], yearsExperience: 6 },
        ],
        availabilityPattern: {
          type: 'rotating',
          preferredShifts: ['day', 'night'],
          unavailableDays: [],
          maxHoursPerWeek: 40,
          minRestHours: 11,
        },
        metadata: {
          role: 'Registered Nurse',
          department: 'Intensive Care Unit',
          employeeType: 'full_time',
        },
      },
      {
        name: 'Nurse Christopher Brown',
        email: 'christopher.brown@hospital.com',
        skills: [
          { name: 'Critical Care Nursing', level: 'advanced', certifications: ['ACLS', 'BLS', 'CCRN'], yearsExperience: 4 },
          { name: 'Critical Care', level: 'advanced', certifications: ['ACLS', 'BLS', 'CCRN'], yearsExperience: 4 },
          { name: 'ACLS', level: 'expert', certifications: ['ACLS'], yearsExperience: 4 },
          { name: 'BLS', level: 'expert', certifications: ['BLS'], yearsExperience: 4 },
          { name: 'Emergency Medicine', level: 'intermediate', certifications: ['ACLS', 'BLS'], yearsExperience: 4 },
          { name: 'Pediatric Critical Care', level: 'intermediate', certifications: ['ACLS', 'BLS', 'PALS', 'CCRN'], yearsExperience: 4 },
        ],
        availabilityPattern: {
          type: 'flexible',
          preferredShifts: ['day', 'evening'],
          unavailableDays: ['friday'],
          maxHoursPerWeek: 36,
          minRestHours: 12,
        },
        metadata: {
          role: 'Registered Nurse',
          department: 'Intensive Care Unit',
          employeeType: 'full_time',
        },
      },
      // Operating Room employees (need Surgical Nursing, BLS, CNOR, and constraint skills)
      {
        name: 'Nurse Amanda Wilson',
        email: 'amanda.wilson@hospital.com',
        skills: [
          { name: 'Surgical Nursing', level: 'expert', certifications: ['BLS', 'CNOR'], yearsExperience: 7 },
          { name: 'ACLS', level: 'expert', certifications: ['ACLS'], yearsExperience: 7 },
          { name: 'BLS', level: 'expert', certifications: ['BLS'], yearsExperience: 7 },
          { name: 'Emergency Medicine', level: 'advanced', certifications: ['ACLS', 'BLS'], yearsExperience: 7 },
          { name: 'Critical Care', level: 'intermediate', certifications: ['ACLS', 'BLS'], yearsExperience: 7 },
          { name: 'OR Coordination', level: 'expert', certifications: ['CNOR'], yearsExperience: 7 },
        ],
        availabilityPattern: {
          type: 'fixed',
          preferredShifts: ['day'],
          unavailableDays: ['saturday', 'sunday'],
          maxHoursPerWeek: 40,
          minRestHours: 10,
        },
        metadata: {
          role: 'Registered Nurse',
          department: 'Operating Room',
          employeeType: 'full_time',
        },
      },
      {
        name: 'Nurse Daniel Martinez',
        email: 'daniel.martinez@hospital.com',
        skills: [
          { name: 'Surgical Nursing', level: 'advanced', certifications: ['BLS', 'CNOR'], yearsExperience: 5 },
          { name: 'ACLS', level: 'expert', certifications: ['ACLS'], yearsExperience: 5 },
          { name: 'BLS', level: 'expert', certifications: ['BLS'], yearsExperience: 5 },
          { name: 'Emergency Medicine', level: 'intermediate', certifications: ['ACLS', 'BLS'], yearsExperience: 5 },
          { name: 'Critical Care', level: 'intermediate', certifications: ['ACLS', 'BLS'], yearsExperience: 5 },
          { name: 'Anesthesia Assistance', level: 'intermediate', certifications: ['CNOR'], yearsExperience: 5 },
        ],
        availabilityPattern: {
          type: 'standard',
          preferredShifts: ['day'],
          unavailableDays: ['saturday', 'sunday'],
          maxHoursPerWeek: 40,
          minRestHours: 10,
        },
        metadata: {
          role: 'Registered Nurse',
          department: 'Operating Room',
          employeeType: 'full_time',
        },
      },
      // Outpatient Clinic employees (need Primary Care, BLS, and constraint skills)
      {
        name: 'Nurse Practitioner Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        skills: [
          { name: 'Primary Care', level: 'expert', certifications: ['BLS', 'NP-C'], yearsExperience: 6 },
          { name: 'ACLS', level: 'expert', certifications: ['ACLS'], yearsExperience: 6 },
          { name: 'BLS', level: 'expert', certifications: ['BLS'], yearsExperience: 6 },
          { name: 'Emergency Medicine', level: 'intermediate', certifications: ['ACLS', 'BLS'], yearsExperience: 6 },
          { name: 'Critical Care', level: 'intermediate', certifications: ['ACLS', 'BLS'], yearsExperience: 6 },
          { name: 'Chronic Disease Management', level: 'advanced', certifications: ['NP-C'], yearsExperience: 6 },
        ],
        availabilityPattern: {
          type: 'standard',
          preferredShifts: ['day'],
          unavailableDays: ['saturday', 'sunday'],
          maxHoursPerWeek: 40,
          minRestHours: 10,
        },
        metadata: {
          role: 'Nurse Practitioner',
          department: 'Outpatient Clinic',
          employeeType: 'full_time',
        },
      },
      {
        name: 'Nurse Thomas Anderson',
        email: 'thomas.anderson@hospital.com',
        skills: [
          { name: 'Primary Care', level: 'intermediate', certifications: ['BLS'], yearsExperience: 3 },
          { name: 'ACLS', level: 'expert', certifications: ['ACLS'], yearsExperience: 3 },
          { name: 'BLS', level: 'expert', certifications: ['BLS'], yearsExperience: 3 },
          { name: 'Emergency Medicine', level: 'intermediate', certifications: ['ACLS', 'BLS'], yearsExperience: 3 },
          { name: 'Critical Care', level: 'intermediate', certifications: ['ACLS', 'BLS'], yearsExperience: 3 },
          { name: 'General Nursing', level: 'intermediate', certifications: ['BLS'], yearsExperience: 3 },
        ],
        availabilityPattern: {
          type: 'standard',
          preferredShifts: ['day'],
          unavailableDays: [],
          maxHoursPerWeek: 40,
          minRestHours: 10,
        },
        metadata: {
          role: 'Registered Nurse',
          department: 'Outpatient Clinic',
          employeeType: 'full_time',
        },
      },
    ];
    
    // Create employees that match shift requirements
    for (let i = 0; i < employeeTemplates.length; i++) {
      const empTemplate = employeeTemplates[i];
      
      // Check if employee already exists
      const existing = await findEntityByName('/employees', 'name', empTemplate.name);
      if (existing) {
        createdData.employees.push(existing);
        console.log(`   [${i + 1}/${employeeTemplates.length}] ✅ Found existing: ${empTemplate.name} [ID: ${existing.id}]`);
        continue;
      }
      
      try {
        console.log(`   [${i + 1}/${employeeTemplates.length}] Creating: ${empTemplate.name}...`);
        console.log(`      ⏳ POST ${API_BASE}/employees`);
        const response = await axios.post(`${API_BASE}/employees`, empTemplate, {
          validateStatus: (status) => status < 500,
        });
        
        if (response.status === 201 || response.status === 200) {
          createdData.employees.push(response.data);
          console.log(`      ✅ Created (${response.status}): ${empTemplate.name} [ID: ${response.data.id}]`);
        } else if (response.status === 409 || response.status === 400) {
          const errorMsg = response.data?.message || JSON.stringify(response.data);
          if (errorMsg.includes('duplicate') || errorMsg.includes('unique constraint') || errorMsg.includes('already exists')) {
            console.log(`      ⚠ Already exists (${response.status}), fetching...`);
            const existingEmp = await findEntityByName('/employees', 'name', empTemplate.name);
            if (existingEmp) {
              createdData.employees.push(existingEmp);
              console.log(`      ✅ Found existing: ${empTemplate.name} [ID: ${existingEmp.id}]`);
            }
          } else {
            console.error(`      ❌ Failed (${response.status}): ${errorMsg}`);
          }
        } else {
          console.error(`      ❌ Failed (${response.status}): ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message || '';
        if (error.response?.status === 400 && (
          errorMsg.includes('duplicate') || 
          errorMsg.includes('unique constraint') || 
          errorMsg.includes('employees_email_key') ||
          errorMsg.includes('already exists')
        )) {
          console.log(`      ⚠ Already exists, fetching...`);
          const existingEmp = await findEntityByName('/employees', 'name', empTemplate.name);
          if (existingEmp) {
            createdData.employees.push(existingEmp);
            console.log(`      ✅ Found existing: ${empTemplate.name} [ID: ${existingEmp.id}]`);
          }
        } else {
          if (error.response) {
            console.error(`      ❌ Error (${error.response.status}): ${errorMsg}`);
          } else if (error.request) {
            console.error(`      ❌ Network error: No response received`);
          } else {
            console.error(`      ❌ Error: ${error.message}`);
          }
        }
      }
      await wait(200);
    }
    
    console.log(`   ✅ Total employees available: ${createdData.employees.length}\n`);
    await wait(500);

    // 3. Create Constraints
    console.log('⚖️  Processing constraints...');
    for (let i = 0; i < testData.constraints.length; i++) {
      const constraint = testData.constraints[i];
      console.log(`   [${i + 1}/${testData.constraints.length}] Processing: ${constraint.type}...`);
      
      try {
        // Prepare constraint data - remove metadata field if present (not in database schema)
        const constraintData = {
          type: constraint.type,
          rules: constraint.rules,
          priority: constraint.priority,
          active: constraint.active !== undefined ? constraint.active : true,
        };
        
        console.log(`      ⏳ POST ${API_BASE}/constraints`);
        const response = await axios.post(`${API_BASE}/constraints`, constraintData, {
          validateStatus: (status) => status < 500,
        });
        
        if (response.status === 201 || response.status === 200) {
          createdData.constraints.push(response.data);
          console.log(`      ✅ Created (${response.status}): ${constraint.type} [ID: ${response.data.id}, Priority: ${constraint.priority}]`);
        } else if (response.status === 409 || response.status === 400) {
          const errorMsg = response.data?.message || JSON.stringify(response.data);
          if (errorMsg.includes('duplicate') || errorMsg.includes('unique constraint') || errorMsg.includes('already exists')) {
            console.log(`      ⚠ Already exists (${response.status}), fetching existing entity...`);
            const existing = await findEntityByType('/constraints', 'type', constraint.type);
            if (existing) {
              createdData.constraints.push(existing);
              console.log(`      ✅ Found existing: ${constraint.type} [ID: ${existing.id}]`);
            } else {
              console.log(`      ⚠ Could not fetch existing entity, skipping`);
            }
          } else {
            console.error(`      ❌ Failed (${response.status}): ${errorMsg}`);
          }
        } else {
          console.error(`      ❌ Failed (${response.status}): ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message || '';
        if (error.response?.status === 400 && (
          errorMsg.includes('duplicate') || 
          errorMsg.includes('unique constraint') || 
          errorMsg.includes('already exists')
        )) {
          console.log(`      ⚠ Already exists, fetching existing entity...`);
          const existing = await findEntityByType('/constraints', 'type', constraint.type);
          if (existing) {
            createdData.constraints.push(existing);
            console.log(`      ✅ Found existing: ${constraint.type} [ID: ${existing.id}]`);
          } else {
            console.log(`      ⚠ Could not fetch existing entity, skipping`);
          }
        } else {
          if (error.response) {
            console.error(`      ❌ Error (${error.response.status}): ${errorMsg}`);
          } else if (error.request) {
            console.error(`      ❌ Network error: No response received`);
          } else {
            console.error(`      ❌ Error: ${error.message}`);
          }
        }
      }
      await wait(200);
    }
    console.log(`   ✅ Processed ${testData.constraints.length} constraints (${createdData.constraints.length} available)\n`);
    await wait(500);

    // 4. Create Shifts (need department IDs)
    console.log('🕐 Processing shifts...');
    if (createdData.departments.length === 0) {
      console.log('   ⚠ No departments available, fetching from backend...');
      try {
        const response = await axios.get(`${API_BASE}/departments`);
        const departments = Array.isArray(response.data) ? response.data : response.data.data || [];
        createdData.departments.push(...departments);
        console.log(`   ✅ Fetched ${departments.length} existing departments from backend`);
      } catch (error) {
        console.error(`   ❌ Failed to fetch departments: ${error.message}`);
      }
    }
    
    if (createdData.departments.length === 0) {
      console.log('   ❌ Cannot create shifts: No departments available\n');
    } else {
      // Generate shifts with future dates for optimization testing
      // Create shifts for the next 7 days, starting from tomorrow
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Define shift templates for different departments and times
      const shiftTemplates = [
        // Emergency Department - Day shifts (7:00-19:00)
        { deptIndex: 0, name: 'ED Day Shift', startHour: 7, endHour: 19, requiredSkills: [{ name: 'Emergency Medicine' }], minStaffing: 3, maxStaffing: 5 },
        // Emergency Department - Night shifts (19:00-07:00 next day)
        { deptIndex: 0, name: 'ED Night Shift', startHour: 19, endHour: 7, requiredSkills: [{ name: 'Emergency Medicine' }], minStaffing: 2, maxStaffing: 4 },
        // ICU - Day shifts
        { deptIndex: 1, name: 'ICU Day Shift', startHour: 7, endHour: 19, requiredSkills: [{ name: 'Critical Care Nursing' }], minStaffing: 2, maxStaffing: 4 },
        // ICU - Night shifts
        { deptIndex: 1, name: 'ICU Night Shift', startHour: 19, endHour: 7, requiredSkills: [{ name: 'Critical Care Nursing' }], minStaffing: 2, maxStaffing: 3 },
        // Operating Room - Morning blocks (6:00-14:00)
        { deptIndex: 2, name: 'OR Morning Block', startHour: 6, endHour: 14, requiredSkills: [{ name: 'Surgical Nursing' }], minStaffing: 2, maxStaffing: 3 },
        // Outpatient Clinic - Day shifts (8:00-17:00)
        { deptIndex: 3, name: 'Clinic Day Shift', startHour: 8, endHour: 17, requiredSkills: [{ name: 'Primary Care' }], minStaffing: 2, maxStaffing: 4 },
      ];
      
      const shiftsToCreate = [];
      
      // Generate shifts for each day over the next 7 days
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const shiftDate = new Date(tomorrow);
        shiftDate.setDate(shiftDate.getDate() + dayOffset);
        
        // Create shifts for each template
        for (const template of shiftTemplates) {
          const dept = createdData.departments[template.deptIndex % createdData.departments.length];
          if (!dept) continue;
          
          const startTime = new Date(shiftDate);
          startTime.setHours(template.startHour, 0, 0, 0);
          
          const endTime = new Date(shiftDate);
          if (template.endHour < template.startHour) {
            // Night shift that spans to next day
            endTime.setDate(endTime.getDate() + 1);
          }
          endTime.setHours(template.endHour, 0, 0, 0);
          
          shiftsToCreate.push({
            departmentId: dept.id,
            requiredSkills: template.requiredSkills, // Array of objects with name property
            minStaffing: template.minStaffing,
            maxStaffing: template.maxStaffing,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            metadata: {
              name: `${template.name} - ${shiftDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
              shiftType: template.startHour < 12 ? 'day' : (template.startHour >= 19 || template.endHour < 12 ? 'night' : 'evening'),
              department: dept.name,
              priority: template.deptIndex === 0 ? 'high' : 'medium',
            },
          });
        }
      }
      
      console.log(`   📋 Generated ${shiftsToCreate.length} shifts for optimization testing (next 7 days)`);
      
      // Create shifts from test data first (if any)
      for (let i = 0; i < testData.shifts.length; i++) {
        const shift = testData.shifts[i];
        const dept = createdData.departments[i % createdData.departments.length];
        const shiftName = shift.metadata?.name || `Shift ${i + 1}`;
        
        console.log(`   [${i + 1}/${testData.shifts.length}] Processing: ${shiftName}...`);
        
        if (!dept) {
          console.log(`      ⚠ Skipped: No department available`);
          continue;
        }

        try {
          // Ensure requiredSkills is in correct format (array of objects with name)
          const requiredSkills = shift.requiredSkills || shift.required_skills || [];
          const formattedRequiredSkills = Array.isArray(requiredSkills)
            ? requiredSkills.map(skill => 
                typeof skill === 'string' 
                  ? { name: skill }
                  : (skill.name ? { name: skill.name } : skill)
              )
            : [];
          
          const shiftData = {
            departmentId: dept.id,
            requiredSkills: formattedRequiredSkills.length > 0 ? formattedRequiredSkills : undefined,
            minStaffing: shift.minStaffing || shift.min_staffing || 1,
            maxStaffing: shift.maxStaffing || shift.max_staffing || 3,
            startTime: shift.startTime || shift.start_time,
            endTime: shift.endTime || shift.end_time,
            metadata: shift.metadata || {},
          };
          
          console.log(`      ⏳ POST ${API_BASE}/shifts (department: ${dept.name})`);
          const response = await axios.post(`${API_BASE}/shifts`, shiftData, {
            validateStatus: (status) => status < 500,
          });
          
          if (response.status === 201 || response.status === 200) {
            createdData.shifts.push(response.data);
            console.log(`      ✅ Created (${response.status}): ${shiftName} for ${dept.name} [ID: ${response.data.id}]`);
          } else if (response.status === 409 || response.status === 400) {
            console.log(`      ⚠ Already exists (${response.status}), skipping`);
          } else {
            console.error(`      ❌ Failed (${response.status}): ${JSON.stringify(response.data)}`);
          }
        } catch (error) {
          if (error.response) {
            console.error(`      ❌ Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
          } else if (error.request) {
            console.error(`      ❌ Network error: No response received`);
          } else {
            console.error(`      ❌ Error: ${error.message}`);
          }
        }
        await wait(200);
      }
      
      // Create generated shifts for optimization testing
      console.log(`   🚀 Creating ${shiftsToCreate.length} optimization test shifts...`);
      for (let i = 0; i < shiftsToCreate.length; i++) {
        const shiftData = shiftsToCreate[i];
        const dept = createdData.departments.find(d => d.id === shiftData.departmentId);
        const shiftName = shiftData.metadata?.name || `Optimization Shift ${i + 1}`;
        
        if (i % 10 === 0) {
          console.log(`   [${i + 1}/${shiftsToCreate.length}] Creating optimization test shifts...`);
        }
        
        try {
          console.log(`      ⏳ POST ${API_BASE}/shifts (${shiftName})`);
          const response = await axios.post(`${API_BASE}/shifts`, shiftData, {
            validateStatus: (status) => status < 500,
          });
          
          if (response.status === 201 || response.status === 200) {
            createdData.shifts.push(response.data);
            if (i < 5 || i % 10 === 0) {
              console.log(`      ✅ Created (${response.status}): ${shiftName} [ID: ${response.data.id}]`);
            }
          } else if (response.status === 409 || response.status === 400) {
            // Skip if already exists
            if (i < 5) {
              console.log(`      ⚠ Already exists (${response.status}), skipping`);
            }
          } else {
            if (i < 5) {
              console.error(`      ❌ Failed (${response.status}): ${JSON.stringify(response.data)}`);
            }
          }
        } catch (error) {
          if (i < 5) {
            if (error.response) {
              console.error(`      ❌ Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
              console.error(`      ❌ Network error: No response received`);
            } else {
              console.error(`      ❌ Error: ${error.message}`);
            }
          }
        }
        await wait(100); // Faster for bulk creation
      }
      
      if (shiftsToCreate.length > 5) {
        console.log(`   ✅ Created ${createdData.shifts.length - testData.shifts.length} additional optimization test shifts`);
      }
    }
    console.log(`   ✅ Processed ${createdData.shifts.length} total shifts\n`);
    await wait(500);

    // 5. Create Schedules (need employee and shift IDs)
    console.log('📅 Processing schedules...');
    if (createdData.employees.length === 0 || createdData.shifts.length === 0) {
      console.log('   ⚠ Missing dependencies, fetching from backend...');
      if (createdData.employees.length === 0) {
        try {
          const response = await axios.get(`${API_BASE}/employees`);
          const employees = Array.isArray(response.data) ? response.data : response.data.data || [];
          createdData.employees.push(...employees);
          console.log(`   ✅ Fetched ${employees.length} existing employees from backend`);
        } catch (error) {
          console.error(`   ❌ Failed to fetch employees: ${error.message}`);
        }
      }
      if (createdData.shifts.length === 0) {
        try {
          const response = await axios.get(`${API_BASE}/shifts`);
          const shifts = Array.isArray(response.data) ? response.data : response.data.data || [];
          createdData.shifts.push(...shifts);
          console.log(`   ✅ Fetched ${shifts.length} existing shifts from backend`);
        } catch (error) {
          console.error(`   ❌ Failed to fetch shifts: ${error.message}`);
        }
      }
    }
    
    if (createdData.employees.length === 0 || createdData.shifts.length === 0) {
      console.log(`   ❌ Cannot create schedules: Missing ${createdData.employees.length === 0 ? 'employees' : ''}${createdData.employees.length === 0 && createdData.shifts.length === 0 ? ' and ' : ''}${createdData.shifts.length === 0 ? 'shifts' : ''}\n`);
    } else {
      // Fetch existing valid schedules from database to use as seed data
      const existingValidSchedules = await fetchValidSchedules();
      if (existingValidSchedules.length > 0) {
        console.log(`   📋 Using ${existingValidSchedules.length} existing valid schedules from database`);
      }
      
      // Helper function to extract skill names from employee skills array
      const getEmployeeSkillNames = (employee) => {
        if (!employee.skills || !Array.isArray(employee.skills)) {
          return [];
        }
        return employee.skills.map(skill => {
          if (typeof skill === 'string') return skill;
          return skill?.name || String(skill);
        });
      };
      
      // Helper function to extract required skill names from shift
      const getShiftRequiredSkillNames = (shift) => {
        const requiredSkills = shift.requiredSkills || shift.required_skills;
        if (!requiredSkills) return [];
        if (Array.isArray(requiredSkills)) {
          return requiredSkills.map(skill => {
            if (typeof skill === 'string') return skill;
            return skill?.name || String(skill);
          });
        }
        // If it's a dict (from optimizer transformation), extract keys
        if (typeof requiredSkills === 'object' && !Array.isArray(requiredSkills)) {
          return Object.keys(requiredSkills);
        }
        return [];
      };
      
      // Get constraint-required skills (if any skill_requirement constraints exist)
      const getConstraintRequiredSkills = () => {
        const skillRequirementConstraints = createdData.constraints.filter(
          c => c.type === 'skill_requirement' && c.active
        );
        if (skillRequirementConstraints.length === 0) return [];
        
        // Get all required skills from all skill_requirement constraints
        const allRequiredSkills = new Set();
        skillRequirementConstraints.forEach(constraint => {
          if (constraint.rules?.requiredSkills && Array.isArray(constraint.rules.requiredSkills)) {
            constraint.rules.requiredSkills.forEach(skill => allRequiredSkills.add(skill));
          }
        });
        return Array.from(allRequiredSkills);
      };
      
      const constraintRequiredSkills = getConstraintRequiredSkills();
      
      // Helper function to check if employee has required skills for shift AND constraints
      const employeeHasRequiredSkills = (employee, shift) => {
        const employeeSkills = getEmployeeSkillNames(employee);
        const shiftRequiredSkills = getShiftRequiredSkillNames(shift);
        
        // Check shift requirements
        if (shiftRequiredSkills.length > 0) {
          const hasShiftSkills = shiftRequiredSkills.every(skill => employeeSkills.includes(skill));
          if (!hasShiftSkills) return false;
        }
        
        // Check constraint requirements (if any)
        if (constraintRequiredSkills.length > 0) {
          const hasConstraintSkills = constraintRequiredSkills.every(skill => employeeSkills.includes(skill));
          if (!hasConstraintSkills) return false;
        }
        
        return true;
      };
      
      // Helper function to check basic availability
      const isEmployeeAvailableForShift = (employee, shift) => {
        const shiftStart = new Date(shift.startTime || shift.start_time);
        const shiftEnd = new Date(shift.endTime || shift.end_time);
        const dayOfWeek = shiftStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const shiftStartHour = shiftStart.getHours();
        const shiftEndHour = shiftEnd.getHours();
        
        // Check employee's availability pattern
        const availabilityPattern = employee.availabilityPattern || employee.availability_pattern;
        
        // Check unavailable days
        if (availabilityPattern?.unavailableDays) {
          const unavailableDays = availabilityPattern.unavailableDays;
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          if (unavailableDays.includes(dayNames[dayOfWeek])) {
            return false;
          }
        }
        
        // Check availability constraint windows (Monday-Friday 08:00-17:00)
        // For seed data, try to match shifts that fall within these windows
        const availabilityConstraints = createdData.constraints.filter(
          c => c.type === 'availability' && c.active && c.rules?.availabilityWindows
        );
        
        if (availabilityConstraints.length > 0) {
          // Check if shift falls within any availability window
          const hasMatchingWindow = availabilityConstraints.some(constraint => {
            const windows = constraint.rules.availabilityWindows || [];
            return windows.some(window => {
              // window.dayOfWeek: 1 = Monday, 5 = Friday
              // window.startTime/endTime: "HH:MM" format
              if (window.dayOfWeek && dayOfWeek !== window.dayOfWeek) {
                return false;
              }
              
              // Parse window times
              const [windowStartHour, windowStartMin] = (window.startTime || '00:00').split(':').map(Number);
              const [windowEndHour, windowEndMin] = (window.endTime || '23:59').split(':').map(Number);
              
              // Check if shift overlaps with window
              const windowStart = windowStartHour * 60 + windowStartMin;
              const windowEnd = windowEndHour * 60 + windowEndMin;
              const shiftStartMinutes = shiftStartHour * 60 + shiftStart.getMinutes();
              const shiftEndMinutes = shiftEndHour * 60 + shiftEnd.getMinutes();
              
              // Shift must start and end within window (or at least overlap)
              return shiftStartMinutes >= windowStart && shiftEndMinutes <= windowEnd;
            });
          });
          
          // If there are availability constraints but no matching window, skip this shift
          // (unless it's a night shift or outside business hours, which might be okay)
          if (!hasMatchingWindow && dayOfWeek >= 1 && dayOfWeek <= 5) {
            // For weekday shifts, try to match business hours
            if (shiftStartHour < 8 || shiftEndHour > 17) {
              return false; // Outside business hours on weekday
            }
          }
        }
        
        return true; // Default to available if no specific restrictions
      };
      
      // Combine test data schedules with existing valid schedules
      const allSchedulesToCreate = [
        ...testData.schedules,
        ...existingValidSchedules,
      ];
      
      // Create schedules from test data and existing valid schedules (with skill matching)
      for (let i = 0; i < allSchedulesToCreate.length; i++) {
        const schedule = allSchedulesToCreate[i];
        
        // Find an employee and shift that match
        let matched = false;
        for (const employee of createdData.employees) {
          for (const shift of createdData.shifts) {
            if (employeeHasRequiredSkills(employee, shift) && isEmployeeAvailableForShift(employee, shift)) {
              matched = true;
              
              const scheduleSource = i < testData.schedules.length ? 'test data' : 'existing database';
              console.log(`   [${i + 1}/${allSchedulesToCreate.length}] Processing schedule (from ${scheduleSource})...`);

              try {
                // Use shift times from API response (camelCase) or fallback to schedule times
                const shiftStartTime = shift.startTime || shift.start_time;
                const shiftEndTime = shift.endTime || shift.end_time;
                
                // Try with 'confirmed' status first, fallback to 'tentative' if validation fails
                let scheduleData = {
                  employeeId: employee.id,
                  shiftId: shift.id,
                  startTime: schedule.startTime || shiftStartTime,
                  endTime: schedule.endTime || shiftEndTime,
                  status: schedule.status || 'confirmed',
                  metadata: schedule.metadata || {},
                };
                console.log(`      ⏳ POST ${API_BASE}/schedules (employee: ${employee.name}, shift: ${shift.metadata?.name || 'N/A'})`);
                let response = await axios.post(`${API_BASE}/schedules`, scheduleData, {
                  validateStatus: (status) => status < 500,
                });
                
                // If validation failed with 'confirmed', try 'tentative' status
                if (response.status === 400 && scheduleData.status === 'confirmed') {
                  console.log(`      ⚠ Validation failed with 'confirmed', trying 'tentative' status...`);
                  scheduleData.status = 'tentative';
                  response = await axios.post(`${API_BASE}/schedules`, scheduleData, {
                    validateStatus: (status) => status < 500,
                  });
                }
                
                if (response.status === 201 || response.status === 200) {
                  createdData.schedules.push(response.data);
                  console.log(`      ✅ Created (${response.status}): Schedule for ${employee.name} [ID: ${response.data.id}, Status: ${scheduleData.status}]`);
                } else if (response.status === 409 || response.status === 400) {
                  console.log(`      ⚠ Already exists or validation failed (${response.status}), skipping`);
                } else {
                  console.error(`      ❌ Failed (${response.status}): ${JSON.stringify(response.data)}`);
                }
              } catch (error) {
                if (error.response) {
                  console.error(`      ❌ Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
                } else if (error.request) {
                  console.error(`      ❌ Network error: No response received`);
                } else {
                  console.error(`      ❌ Error: ${error.message}`);
                }
              }
              
              await wait(200);
              break;
            }
          }
          if (matched) break;
        }
        
        if (!matched) {
          console.log(`   [${i + 1}/${allSchedulesToCreate.length}] ⚠ Skipped: No matching employee-shift pair found`);
        }
      }
      
      // Create additional schedules for optimization testing
      // Match employees with shifts based on skills
      console.log(`   🚀 Creating optimization test schedules...`);
      const schedulesToCreate = [];
      
      // Get shifts from the first 2 days (to have some existing schedules)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const shiftsForSchedules = createdData.shifts
        .filter(shift => {
          const shiftStart = new Date(shift.startTime || shift.start_time);
          const twoDaysLater = new Date(tomorrow);
          twoDaysLater.setDate(twoDaysLater.getDate() + 2);
          return shiftStart >= tomorrow && shiftStart <= twoDaysLater;
        })
        .slice(0, Math.min(15, createdData.shifts.length)); // Limit to first 15 shifts
      
      // Match employees to shifts based on skills and availability
      let scheduleCount = 0;
      for (const shift of shiftsForSchedules) {
        if (scheduleCount >= 10) break; // Limit to 10 schedules
        
        // Find employees that match this shift
        for (const employee of createdData.employees) {
          if (scheduleCount >= 10) break;
          
          if (employeeHasRequiredSkills(employee, shift) && isEmployeeAvailableForShift(employee, shift)) {
            const shiftStartTime = shift.startTime || shift.start_time;
            const shiftEndTime = shift.endTime || shift.end_time;
            
            schedulesToCreate.push({
              employeeId: employee.id,
              shiftId: shift.id,
              startTime: shiftStartTime,
              endTime: shiftEndTime,
              status: 'tentative', // Use tentative to be more lenient with constraints
              metadata: {
                assignmentType: 'primary',
                notes: 'Pre-existing schedule for optimization testing',
              },
            });
            scheduleCount++;
            break; // One employee per shift for seed data
          }
        }
      }
      
      console.log(`   📋 Generated ${schedulesToCreate.length} schedules for optimization testing`);
      
      for (let i = 0; i < schedulesToCreate.length; i++) {
        const scheduleData = schedulesToCreate[i];
        const employee = createdData.employees.find(e => e.id === scheduleData.employeeId);
        const shift = createdData.shifts.find(s => s.id === scheduleData.shiftId);
        
        if (i % 5 === 0) {
          console.log(`   [${i + 1}/${schedulesToCreate.length}] Creating optimization test schedules...`);
        }
        
        try {
          if (i < 3) {
            console.log(`      ⏳ POST ${API_BASE}/schedules (employee: ${employee?.name || 'N/A'}, shift: ${shift?.metadata?.name || 'N/A'})`);
          }
          const response = await axios.post(`${API_BASE}/schedules`, scheduleData, {
            validateStatus: (status) => status < 500,
          });
          
          if (response.status === 201 || response.status === 200) {
            createdData.schedules.push(response.data);
            if (i < 3) {
              console.log(`      ✅ Created (${response.status}): Schedule for ${employee?.name || 'N/A'} [ID: ${response.data.id}]`);
            }
          } else if (response.status === 409 || response.status === 400) {
            // Skip if already exists
            if (i < 3) {
              console.log(`      ⚠ Already exists (${response.status}), skipping`);
            }
          } else {
            if (i < 3) {
              console.error(`      ❌ Failed (${response.status}): ${JSON.stringify(response.data)}`);
            }
          }
        } catch (error) {
          if (i < 3) {
            if (error.response) {
              console.error(`      ❌ Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
              console.error(`      ❌ Network error: No response received`);
            } else {
              console.error(`      ❌ Error: ${error.message}`);
            }
          }
        }
        await wait(100); // Faster for bulk creation
      }
      
      if (schedulesToCreate.length > 3) {
        console.log(`   ✅ Created ${createdData.schedules.length - testData.schedules.length} additional optimization test schedules`);
      }
    }
    console.log(`   ✅ Processed ${createdData.schedules.length} total schedules\n`);

    // Export valid schedules to test-data.json for use in tests
    if (createdData.schedules.length > 0) {
      try {
        const testDataContent = fs.readFileSync(TEST_DATA_PATH, 'utf-8');
        const testDataJson = JSON.parse(testDataContent);
        
        // Convert schedules to test data format (without IDs, will be matched)
        const validatedSchedules = createdData.schedules
          .filter(schedule => schedule.status === 'confirmed' || schedule.status === 'tentative')
          .slice(0, 10) // Limit to first 10 validated schedules
          .map(schedule => {
            // Find employee and shift names for reference
            const employee = createdData.employees.find(e => e.id === schedule.employeeId);
            const shift = createdData.shifts.find(s => s.id === schedule.shiftId);
            
            return {
              employeeId: '', // Will be matched by seed script
              shiftId: '', // Will be matched by seed script
              startTime: schedule.startTime || schedule.start_time,
              endTime: schedule.endTime || schedule.end_time,
              status: schedule.status || 'confirmed',
              metadata: {
                ...(schedule.metadata || {}),
                _employeeName: employee?.name || '',
                _shiftName: shift?.metadata?.name || shift?.name || '',
                _notes: 'Validated schedule from database',
              },
            };
          });
        
        // Update test-data.json with validated schedules (append to existing)
        if (validatedSchedules.length > 0) {
          // Keep original schedules and add validated ones
          const existingSchedules = testDataJson.schedules || [];
          testDataJson.schedules = [
            ...existingSchedules.filter((s) => !s.metadata?._notes?.includes('Validated schedule')),
            ...validatedSchedules,
          ];
          
          // Write back to file
          fs.writeFileSync(TEST_DATA_PATH, JSON.stringify(testDataJson, null, 2));
          console.log(`   💾 Exported ${validatedSchedules.length} validated schedules to ${TEST_DATA_PATH}\n`);
        }
      } catch (error) {
        console.log(`   ⚠ Could not export schedules to test-data.json: ${error.message}\n`);
      }
    }

    // Summary
    console.log('✨ Seeding completed!\n');
    console.log('📊 Final Summary:');
    console.log(`   📁 Departments: ${createdData.departments.length} available`);
    console.log(`   👥 Employees: ${createdData.employees.length} available`);
    console.log(`   ⚖️  Constraints: ${createdData.constraints.length} available`);
    console.log(`   🕐 Shifts: ${createdData.shifts.length} available`);
    console.log(`   📅 Schedules: ${createdData.schedules.length} available\n`);
    
    if (createdData.departments.length === 0 || createdData.employees.length === 0) {
      console.log('⚠️  Warning: Some entities are missing. The database may need manual setup.\n');
    }

  } catch (error) {
    // Log error but don't crash - allow dev server to continue
    console.error('❌ Error during seeding:', error.message);
    if (error.response) {
      console.error(`   HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    if (error.stack && (process.env.NODE_ENV === 'development' || process.env.SEED_BACKEND_STANDALONE === 'true')) {
      console.error('   Stack:', error.stack);
    }
    // Don't exit with error code when run from Vite plugin
    // This allows the dev server to continue even if seeding fails
    if (process.env.SEED_BACKEND_STANDALONE === 'true') {
      console.error('   Exiting because SEED_BACKEND_STANDALONE=true\n');
      process.exit(1);
    } else {
      console.error('   Continuing anyway (not in standalone mode)\n');
    }
  }
}

// Always run seedBackend when script is executed directly
// This ensures the database is populated on startup
seedBackend().catch((error) => {
  console.error('Fatal error in seed script:', error.message);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
  // Only exit with error code in standalone mode
  // In background mode (from Docker), just log the error
  if (process.env.SEED_BACKEND_STANDALONE === 'true') {
    console.error('Exiting because SEED_BACKEND_STANDALONE=true\n');
    process.exit(1);
  } else {
    console.error('Continuing in background mode (errors logged to /tmp/seed.log)\n');
  }
});

export { seedBackend };

