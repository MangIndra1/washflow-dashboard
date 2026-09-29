import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'employee';

export interface CurrentUser {
  role: UserRole;
  name: string;
  email: string;
  avatar: string;
  branchId?: string;
  branchName?: string;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  login: (user: CurrentUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const stored = localStorage.getItem('cleanwave_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (user: CurrentUser) => {
    setCurrentUser(user);
    localStorage.setItem('cleanwave_user', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cleanwave_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}