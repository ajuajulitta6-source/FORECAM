
import React from 'react';
import { User } from '../types';

interface UserContextType {
  user: User | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const UserContext = React.createContext<UserContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  updateProfile: () => {},
});
