import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";

interface User {
  _id: string;
  email: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  logout: () => void;
  setAuth: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  // useEffect(() => {
  //   const storedToken = localStorage.getItem("token");
  //   const storedUser = localStorage.getItem("user");

  //   if (storedToken && storedUser) {
  //     setToken(storedToken);
  //     setUser(JSON.parse(storedUser));
  //   }

  //   setIsLoading(false);
  // }, []);

  useEffect(() => {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (storedToken && storedUser && storedUser !== "undefined") {
    try {
      const parsedUser = JSON.parse(storedUser);

      setToken(storedToken);
      setUser(parsedUser);
    } catch (err) {
      console.error("Invalid user in localStorage, clearing...");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  setIsLoading(false);
}, []);


  const setAuth = (user: User, token: string) => {
    setUser(user);
    setToken(token);

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  // ✅ Logout
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
