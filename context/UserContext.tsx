
import React from 'react';
import { User } from '../types';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  setUser: (user: User | null) => void;
}

export const UserContext = React.createContext<UserContextType>({
  user: null,
  login: async () => { },
  logout: () => { },
  updateProfile: () => { },
  setUser: () => { },
});
