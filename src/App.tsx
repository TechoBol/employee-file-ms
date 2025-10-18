import { Navigate, Route, Routes } from 'react-router';
import './App.css';
import RootLayout from '@/app/layout/RootLayout';
import EmployeesPage from '@/app/pages/employees/EmployeesPage';
import { EmployeeDetailPage } from '@/app/pages/employee-detail/EmployeeDetailPage';
import { DepartmentsPage } from './app/pages/departments/DepartmentsPage';
import { PositionsPage } from './app/pages/positions/PositionsPage';
import { Toaster } from './components/ui/sonner';
import ConfigPage from './app/pages/config/ConfigPage';
import { BranchesPage } from './app/pages/branches/BranchesPage';
import PayrollsPage from './app/pages/payrolls/PayrollPage';

function App() {
  return (
    <>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/employees" element={<EmployeesPage />} />
          <Route
            path="/employees/:employeeId"
            element={<EmployeeDetailPage />}
          />
          <Route path="/salary" element={<PayrollsPage />} />
          <Route path="/branch" element={<BranchesPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="*" element={<Navigate to="/employees" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
