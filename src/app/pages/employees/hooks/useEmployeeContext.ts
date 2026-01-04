import type { EmployeeResponse } from '@/rest-client/interface/response/EmployeeResponse';
import { createContext, useContext } from 'react';

interface EmployeeContextValue {
  onSave: (employee: EmployeeResponse) => void;
}

const EmployeeContext = createContext<EmployeeContextValue | undefined>(undefined);

export const useEmployeeContext = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployeeContext must be used within EmployeeProvider');
  }
  return context;
};

export const EmployeeProvider = EmployeeContext.Provider;