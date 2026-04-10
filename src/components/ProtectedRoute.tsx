import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Mientras se verifica la sesión guardada, no renderizar nada
  // (evita el "flash" donde el usuario ve /login brevemente)
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0f",
          color: "#6c63ff",
          fontFamily: "monospace",
        }}
      >
        Cargando...
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  // `replace` evita que /dashboard quede en el historial del navegador
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizar la ruta hija
  return <Outlet />;
}