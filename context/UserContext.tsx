import React from 'react';
import { User } from '../types';

interface UserContextType {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}

export const UserContext = React.createContext<UserContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});