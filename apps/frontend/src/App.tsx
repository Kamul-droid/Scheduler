import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './app/components/Layout';
import ConstraintManagement from './app/features/constraints/ConstraintManagement';
import EmployeeManagement from './app/features/employees/EmployeeManagement';
import OptimizationPanel from './app/features/scheduler/OptimizationPanel';
import SchedulerView from './app/features/scheduler/SchedulerView';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/app/scheduler" replace />} />
          <Route path="/app/scheduler" element={<SchedulerView />} />
          <Route path="/app/employees" element={<EmployeeManagement />} />
          <Route path="/app/constraints" element={<ConstraintManagement />} />
          <Route path="/app/optimization" element={<OptimizationPanel />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

