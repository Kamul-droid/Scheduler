import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './app/components/Layout';
import ConstraintManagement from './app/features/constraints/ConstraintManagement';
import DepartmentManagement from './app/features/departments/DepartmentManagement';
import EmployeeManagement from './app/features/employees/EmployeeManagement';
import OptimizationPanel from './app/features/scheduler/OptimizationPanel';
import SchedulerView from './app/features/scheduler/SchedulerView';
import ShiftManagement from './app/features/shifts/ShiftManagement';
import SkillsView from './app/features/skills/SkillsView';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/app/scheduler" replace />} />
          <Route path="/app/scheduler" element={<SchedulerView />} />
          <Route path="/app/employees" element={<EmployeeManagement />} />
          <Route path="/app/departments" element={<DepartmentManagement />} />
          <Route path="/app/shifts" element={<ShiftManagement />} />
          <Route path="/app/skills" element={<SkillsView />} />
          <Route path="/app/constraints" element={<ConstraintManagement />} />
          <Route path="/app/optimization" element={<OptimizationPanel />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

