import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  // Simulación temporal hasta que el endpoint del Gateway esté listo
  const handleMockLogin = () => {
    login({
      id: "usr_001",
      nombre: "Riwer de prueba",
      rol: "estudiante",
      token: "mock_jwt_token",
    });
    navigate("/dashboard");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", color: "#e8e8f0" }}>
      <h1>Júpiter — Login</h1>
      <p style={{ color: "#8888aa" }}>
        Aquí irá el formulario real. Por ahora, acceso de prueba:
      </p>
      <button
        onClick={handleMockLogin}
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          background: "#6c63ff",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontFamily: "monospace",
        }}
      >
        Entrar (mock)
      </button>
    </div>
  );
}