import { Route, Routes } from 'react-router';
import './App.css';
import RootLayout from '@/app/layout/RootLayout';
import EmployeesPage from '@/app/pages/employees/EmployeesPage';
import { EmployeeDetailPage } from '@/app/pages/employee-detail/EmployeeDetailPage';

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
        </Route>
      </Routes>
    </>
  );
}

export default App;
