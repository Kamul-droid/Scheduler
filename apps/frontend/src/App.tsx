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
          <Route path="/" element={<Navigate to="/scheduler" replace />} />
          <Route path="/scheduler" element={<SchedulerView />} />
          <Route path="/employees" element={<EmployeeManagement />} />
          <Route path="/constraints" element={<ConstraintManagement />} />
          <Route path="/optimization" element={<OptimizationPanel />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

