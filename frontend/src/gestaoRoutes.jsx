/**
 * Cole este trecho dentro do seu <Routes> no App.jsx
 * 
 * Dependências necessárias (já criadas):
 *   src/layouts/GestaoLayout.jsx
 *   src/pages/GestaoColaboradores.jsx
 *   src/pages/SetoresEquipes.jsx
 *   src/contexts/AuthContext.jsx
 *   src/components/RoleGuard.jsx
 *   src/components/GestaoSidebar.jsx
 * 
 * Certifique-se de que o AuthProvider envolve o App inteiro:
 *   <AuthProvider>
 *     <RouterProvider router={...} />
 *   </AuthProvider>
 */

import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import GestaoLayout from "./layouts/GestaoLayout";
import RoleGuard from "./components/RoleGuard";

const PainelGestor       = lazy(() => import("./pages/PainelGestor"));
const GestaoColaboradores = lazy(() => import("./pages/GestaoColaboradores"));
const SetoresEquipes     = lazy(() => import("./pages/SetoresEquipes"));
const HierarquiaAcesso   = lazy(() => import("./pages/HierarquiaAcesso"));
const RelatoriosEquipe   = lazy(() => import("./pages/RelatoriosEquipe"));

// Adicione dentro do <Routes> do seu App:
export const gestaoRoutes = (
  <Route path="/gestor" element={<GestaoLayout />}>
    <Route index element={
      <Suspense fallback={<LoadingPage />}>
        <PainelGestor />
      </Suspense>
    } />

    <Route path="colaboradores" element={
      <RoleGuard minRole="Gestor">
        <Suspense fallback={<LoadingPage />}>
          <GestaoColaboradores />
        </Suspense>
      </RoleGuard>
    } />

    <Route path="setores" element={
      <RoleGuard minRole="Coordenador">
        <Suspense fallback={<LoadingPage />}>
          <SetoresEquipes />
        </Suspense>
      </RoleGuard>
    } />

    <Route path="hierarquia" element={
      <RoleGuard minRole="Diretor">
        <Suspense fallback={<LoadingPage />}>
          <HierarquiaAcesso />
        </Suspense>
      </RoleGuard>
    } />

    <Route path="relatorios" element={
      <RoleGuard minRole="Gestor">
        <Suspense fallback={<LoadingPage />}>
          <RelatoriosEquipe />
        </Suspense>
      </RoleGuard>
    } />
  </Route>
);

function LoadingPage() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      flex: 1, color: "#6b7280", fontSize: "14px",
    }}>
      <div style={{
        width: "32px", height: "32px", border: "2px solid #1e2d3d",
        borderTop: "2px solid #0e9f8e", borderRadius: "50%",
        animation: "spin 0.8s linear infinite", marginRight: "12px",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      Carregando...
    </div>
  );
}

/*
 * ENDPOINTS DE BACKEND NECESSÁRIOS:
 *
 * GET  /api/auth/me                    → { id, name, email, role, diretoria }
 * GET  /api/colaboradores?diretoria=X  → lista filtrada por escopo
 * POST /api/colaboradores              → criar colaborador
 * DEL  /api/colaboradores/:id          → remover
 * GET  /api/setores?includeEquipes     → setores com equipes aninhadas
 * POST /api/setores                    → criar setor
 * PATCH/api/setores/:id               → renomear
 * DEL  /api/setores/:id               → excluir
 * POST /api/equipes                    → criar equipe
 * DEL  /api/equipes/:id               → remover equipe
 */
