import {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// ── Tipos ────────────────────────────────────────────────────────────
interface User {
  id: string;
  nombre: string;
  rol: "estudiante" | "admin"; // Roles definidos en el Gateway Go
  token: string;               // JWT emitido por el API Gateway
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

// ── Creación del contexto ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "jupiter_token";
const USER_KEY  = "jupiter_user";

// ── Provider ──────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // evita flash de /login

  // Al montar: intentar recuperar sesión previa desde localStorage
  useEffect(() => {
    try {
      const storedUser  = localStorage.getItem(USER_KEY);
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (storedUser && storedToken) {
        const parsed: User = JSON.parse(storedUser);
        setUser({ ...parsed, token: storedToken });
      }
    } catch {
      // Si los datos están corruptos, limpiamos
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, userData.token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook de consumo ───────────────────────────────────────────────────
export { AuthContext };