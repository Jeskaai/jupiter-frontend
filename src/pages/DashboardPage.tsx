import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", color: "#e8e8f0" }}>
      <h1>Dashboard</h1>
      <p>
        Bienvenido, <strong style={{ color: "#6c63ff" }}>{user?.nombre}</strong>
        {" — "}Rol: <strong style={{ color: "#00d4aa" }}>{user?.rol}</strong>
      </p>
      <button
        onClick={handleLogout}
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          background: "#c0392b",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontFamily: "monospace",
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}