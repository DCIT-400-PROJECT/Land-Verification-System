import { jwtDecode } from 'jwt-decode';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

function decodeUserFromToken(token) {
  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp || decoded.exp * 1000 <= Date.now()) return null;
    // Normalise role to lowercase and guard against a missing claim
    return {
      id: decoded.user_id || decoded.id,
      email: decoded.email,
      full_name: decoded.full_name,
      national_id: decoded.national_id,
      role: (decoded.role || '').toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decodedUser = decodeUserFromToken(token);
      if (decodedUser) {
        setUser(decodedUser);
      } else {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = (tokens, userData) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    // Normalise role here too, in case the backend ever changes casing
    setUser({ ...userData, role: (userData.role || '').toLowerCase() });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const isAdmin = !!user && user.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);