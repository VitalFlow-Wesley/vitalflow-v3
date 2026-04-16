import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute, { GestorRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ConnectDevices from "./pages/ConnectDevices";
import Profile from "./pages/Profile";
import MeuRelatorio from "./pages/MeuRelatorio";
import PaymentSuccess from "./pages/PaymentSuccess";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Toaster } from "./components/ui/sonner";
import GestaoLayout from "./layouts/GestaoLayout";
import GestorDashboard from "./pages/GestorDashboard";
import GestaoColaboradores from "./pages/GestaoColaboradores";
import SetoresEquipes from "./pages/SetoresEquipes";
import HierarquiaAcesso from "./pages/HierarquiaAcesso";
import RelatoriosEquipe from "./pages/RelatoriosEquipe";
import RelatorioExecutivo from "./pages/RelatorioExecutivo";
import RelatorioTendencia from "./pages/RelatorioTendencia";
import RelatorioSetor from "./pages/RelatorioSetor";
import RelatorioEquipeDetalhe from "./pages/RelatorioEquipeDetalhe";
import RelatorioRisco from "./pages/RelatorioRisco";
import RelatorioMensal from "./pages/RelatorioMensal";

function App() {
  return (
    <div className="App bg-neutral-950 min-h-screen">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/devices"
              element={
                <ProtectedRoute>
                  <ConnectDevices />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/relatorio"
              element={
                <ProtectedRoute>
                  <MeuRelatorio />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payment/success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />

            <Route
              path="/gestor"
              element={
                <GestorRoute>
                  <GestaoLayout />
                </GestorRoute>
              }
            >
              <Route index element={<GestorDashboard />} />
              <Route path="colaboradores" element={<GestaoColaboradores />} />
              <Route path="setores" element={<SetoresEquipes />} />
              <Route path="hierarquia" element={<HierarquiaAcesso />} />

              <Route path="relatorios" element={<RelatoriosEquipe />} />
              <Route path="relatorios/executivo" element={<RelatorioExecutivo />} />
              <Route path="relatorios/tendencia" element={<RelatorioTendencia />} />
              <Route path="relatorios/setor" element={<RelatorioSetor />} />
              <Route path="relatorios/equipe" element={<RelatorioEquipeDetalhe />} />
              <Route path="relatorios/risco" element={<RelatorioRisco />} />
              <Route path="relatorios/mensal" element={<RelatorioMensal />} />
            </Route>
          </Routes>
        </BrowserRouter>

        <Toaster position="top-right" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;