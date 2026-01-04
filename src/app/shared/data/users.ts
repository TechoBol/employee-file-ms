import type { User } from '../interfaces/user';

export const defaultUser: User = {
  id: 'user-0',
  firstName: 'Josue',
  lastName: 'Veliz',
  email: 'josue.veliz@techobol.com',
};

export const mockUsers: User[] = [
  {
    id: 'user-1',
    firstName: 'Sofía',
    lastName: 'García',
    email: 'sofia.garcia@empresa.com',
  },
  {
    id: 'user-2',
    firstName: 'Mateo',
    lastName: 'López',
    email: 'mateo.lopez@empresa.com',
  },
  {
    id: 'user-3',
    firstName: 'Valentina',
    lastName: 'Martínez',
    email: 'valentina.martinez@empresa.com',
  },
  {
    id: 'user-4',
    firstName: 'Diego',
    lastName: 'Hernández',
    email: 'diego.hernandez@empresa.com',
  },
];
