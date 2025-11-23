import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3000';
const TEST_DATA_PATH = path.join(__dirname, '../cypress/fixtures/test-data.json');

interface TestData {
  departments: any[];
  employees: any[];
  shifts: any[];
  constraints: any[];
  schedules: any[];
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedBackend() {
  console.log('🌱 Seeding backend with test data...\n');

  // Check if backend is available
  try {
    await axios.get(`${API_BASE}/health`);
    console.log('✅ Backend is available\n');
  } catch (error) {
    console.error('❌ Backend is not available. Please start the backend server first.');
    console.error(`   Expected backend at: ${API_BASE}\n`);
    process.exit(1);
  }

  // Load test data
  let testData: TestData;
  try {
    const data = fs.readFileSync(TEST_DATA_PATH, 'utf-8');
    testData = JSON.parse(data);
    console.log(`📦 Loaded test data from: ${TEST_DATA_PATH}\n`);
  } catch (error) {
    console.error('❌ Failed to load test data:', error);
    process.exit(1);
  }

  const createdData: any = {
    departments: [],
    employees: [],
    shifts: [],
    constraints: [],
    schedules: [],
  };

  try {
    // 1. Create Departments
    console.log('📁 Creating departments...');
    for (const dept of testData.departments) {
      try {
        const response = await axios.post(`${API_BASE}/departments`, dept);
        createdData.departments.push(response.data);
        console.log(`   ✓ Created: ${dept.name}`);
      } catch (error: any) {
        if (error.response?.status === 409 || error.response?.status === 400) {
          console.log(`   ⚠ Skipped: ${dept.name} (may already exist)`);
        } else {
          console.error(`   ✗ Failed: ${dept.name}`, error.response?.data || error.message);
        }
      }
    }
    console.log(`   Created ${createdData.departments.length} departments\n`);
    await wait(500);

    // 2. Create Employees
    console.log('👥 Creating employees...');
    for (const emp of testData.employees) {
      try {
        const response = await axios.post(`${API_BASE}/employees`, emp);
        createdData.employees.push(response.data);
        console.log(`   ✓ Created: ${emp.name}`);
      } catch (error: any) {
        if (error.response?.status === 409 || error.response?.status === 400) {
          console.log(`   ⚠ Skipped: ${emp.name} (may already exist)`);
        } else {
          console.error(`   ✗ Failed: ${emp.name}`, error.response?.data || error.message);
        }
      }
    }
    console.log(`   Created ${createdData.employees.length} employees\n`);
    await wait(500);

    // 3. Create Constraints
    console.log('⚖️  Creating constraints...');
    for (const constraint of testData.constraints) {
      try {
        const response = await axios.post(`${API_BASE}/constraints`, constraint);
        createdData.constraints.push(response.data);
        console.log(`   ✓ Created: ${constraint.type} (priority: ${constraint.priority})`);
      } catch (error: any) {
        if (error.response?.status === 409 || error.response?.status === 400) {
          console.log(`   ⚠ Skipped: ${constraint.type} (may already exist)`);
        } else {
          console.error(`   ✗ Failed: ${constraint.type}`, error.response?.data || error.message);
        }
      }
    }
    console.log(`   Created ${createdData.constraints.length} constraints\n`);
    await wait(500);

    // 4. Create Shifts (need department IDs)
    console.log('🕐 Creating shifts...');
    for (let i = 0; i < testData.shifts.length; i++) {
      const shift = testData.shifts[i];
      const dept = createdData.departments[i % createdData.departments.length];
      
      if (!dept) {
        console.log(`   ⚠ Skipped shift (no department available)`);
        continue;
      }

      try {
        const shiftData = {
          ...shift,
          departmentId: dept.id,
        };
        const response = await axios.post(`${API_BASE}/shifts`, shiftData);
        createdData.shifts.push(response.data);
        console.log(`   ✓ Created: ${shift.name || 'Shift'} for ${dept.name}`);
      } catch (error: any) {
        if (error.response?.status === 409 || error.response?.status === 400) {
          console.log(`   ⚠ Skipped: ${shift.name || 'Shift'}`);
        } else {
          console.error(`   ✗ Failed: ${shift.name || 'Shift'}`, error.response?.data || error.message);
        }
      }
    }
    console.log(`   Created ${createdData.shifts.length} shifts\n`);
    await wait(500);

    // 5. Create Schedules (need employee and shift IDs)
    console.log('📅 Creating schedules...');
    for (let i = 0; i < testData.schedules.length; i++) {
      const schedule = testData.schedules[i];
      const employee = createdData.employees[i % createdData.employees.length];
      const shift = createdData.shifts[i % createdData.shifts.length];

      if (!employee || !shift) {
        console.log(`   ⚠ Skipped schedule (no employee or shift available)`);
        continue;
      }

      try {
        const scheduleData = {
          ...schedule,
          employeeId: employee.id,
          shiftId: shift.id,
        };
        const response = await axios.post(`${API_BASE}/schedules`, scheduleData);
        createdData.schedules.push(response.data);
        console.log(`   ✓ Created: Schedule for ${employee.name}`);
      } catch (error: any) {
        if (error.response?.status === 409 || error.response?.status === 400) {
          console.log(`   ⚠ Skipped schedule`);
        } else {
          console.error(`   ✗ Failed schedule`, error.response?.data || error.message);
        }
      }
    }
    console.log(`   Created ${createdData.schedules.length} schedules\n`);

    // Summary
    console.log('✨ Seeding completed!\n');
    console.log('📊 Summary:');
    console.log(`   Departments: ${createdData.departments.length}`);
    console.log(`   Employees: ${createdData.employees.length}`);
    console.log(`   Constraints: ${createdData.constraints.length}`);
    console.log(`   Shifts: ${createdData.shifts.length}`);
    console.log(`   Schedules: ${createdData.schedules.length}\n`);

  } catch (error: any) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedBackend().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { seedBackend };

