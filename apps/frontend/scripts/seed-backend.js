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

async function seedBackend() {
  console.log('🌱 Seeding backend with test data...\n');

  // Check if backend is available
  console.log('⏳ Checking backend availability...');
  try {
    const healthResponse = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    console.log(`✅ Backend is available (${healthResponse.status} ${healthResponse.statusText})\n`);
  } catch (error) {
    console.error('❌ Backend is not available. Please start the backend server first.');
    console.error(`   Expected backend at: ${API_BASE}`);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Error: Connection refused - backend is not running\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   Error: Connection timeout - backend is not responding\n');
    } else {
      console.error(`   Error: ${error.message}\n`);
    }
    process.exit(1);
  }

  // Load test data
  console.log('⏳ Loading test data...');
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
  } catch (error) {
    console.error('❌ Failed to load test data:', error.message);
    process.exit(1);
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
    await wait(500);

    // 3. Create Constraints
    console.log('⚖️  Processing constraints...');
    for (let i = 0; i < testData.constraints.length; i++) {
      const constraint = testData.constraints[i];
      console.log(`   [${i + 1}/${testData.constraints.length}] Processing: ${constraint.type}...`);
      
      try {
        console.log(`      ⏳ POST ${API_BASE}/constraints`);
        const response = await axios.post(`${API_BASE}/constraints`, constraint, {
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
      for (let i = 0; i < testData.shifts.length; i++) {
        const shift = testData.shifts[i];
        const dept = createdData.departments[i % createdData.departments.length];
        const shiftName = shift.name || `Shift ${i + 1}`;
        
        console.log(`   [${i + 1}/${testData.shifts.length}] Processing: ${shiftName}...`);
        
        if (!dept) {
          console.log(`      ⚠ Skipped: No department available`);
          continue;
        }

        try {
          const shiftData = {
            ...shift,
            departmentId: dept.id,
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
    }
    console.log(`   ✅ Processed ${testData.shifts.length} shifts (${createdData.shifts.length} available)\n`);
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
      for (let i = 0; i < testData.schedules.length; i++) {
        const schedule = testData.schedules[i];
        const employee = createdData.employees[i % createdData.employees.length];
        const shift = createdData.shifts[i % createdData.shifts.length];

        console.log(`   [${i + 1}/${testData.schedules.length}] Processing schedule...`);

        if (!employee || !shift) {
          console.log(`      ⚠ Skipped: Missing ${!employee ? 'employee' : ''}${!employee && !shift ? ' and ' : ''}${!shift ? 'shift' : ''}`);
          continue;
        }

        try {
          const scheduleData = {
            ...schedule,
            employeeId: employee.id,
            shiftId: shift.id,
          };
          console.log(`      ⏳ POST ${API_BASE}/schedules (employee: ${employee.name}, shift: ${shift.name || 'N/A'})`);
          const response = await axios.post(`${API_BASE}/schedules`, scheduleData, {
            validateStatus: (status) => status < 500,
          });
          
          if (response.status === 201 || response.status === 200) {
            createdData.schedules.push(response.data);
            console.log(`      ✅ Created (${response.status}): Schedule for ${employee.name} [ID: ${response.data.id}]`);
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
    }
    console.log(`   ✅ Processed ${testData.schedules.length} schedules (${createdData.schedules.length} available)\n`);

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
    if (error.stack && process.env.NODE_ENV === 'development') {
      console.error('   Stack:', error.stack);
    }
    // Don't exit with error code when run from Vite plugin
    // This allows the dev server to continue even if seeding fails
    if (process.env.SEED_BACKEND_STANDALONE === 'true') {
      process.exit(1);
    }
  }
}

// Run if called directly
seedBackend().catch((error) => {
  console.error('Fatal error:', error);
  // Don't exit with error code when run from Vite plugin
  // This allows the dev server to continue even if seeding fails
  if (process.env.SEED_BACKEND_STANDALONE === 'true') {
    process.exit(1);
  }
});

export { seedBackend };

