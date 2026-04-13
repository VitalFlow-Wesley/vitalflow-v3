import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import GestaoSidebar from "../components/GestaoSidebar";
import RoleGuard from "../components/RoleGuard";

function useMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// Tela de bloqueio para mobile
function MobileLock() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0d1117",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px", textAlign: "center",
    }}>
      <div style={{ fontSize: "48px", marginBottom: "20px" }}>🖥️</div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#fff", marginBottom: "12px" }}>
        Área disponível apenas no desktop
      </h2>
      <p style={{ fontSize: "14px", color: "#6b7280", maxWidth: "320px", lineHeight: 1.6 }}>
        A área de gestão requer uma tela maior para exibir todas as informações corretamente.
        Acesse pelo computador para continuar.
      </p>
    </div>
  );
}

export default function GestaoLayout() {
  const isMobile = useMobile();

  if (isMobile) return <MobileLock />;

  return (
    <RoleGuard minRole="Gestor" redirectTo="/">
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0d1117" }}>
        <GestaoSidebar />
        <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <Outlet />
        </main>
      </div>
    </RoleGuard>
  );
}
