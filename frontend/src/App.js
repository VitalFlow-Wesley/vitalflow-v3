import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute, { GestorRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ConnectDevices from "./pages/ConnectDevices";
import Profile from "./pages/Profile";
import MeuRelatorio from "./pages/MeuRelatorio";
import GestorDashboard from "./pages/GestorDashboard";
import GestorLanding from "./pages/GestorLanding";
import PaymentSuccess from "./pages/PaymentSuccess";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Toaster } from "./components/ui/sonner";
import GestaoLayout from "./layouts/GestaoLayout";
import GestaoColaboradores from "./pages/GestaoColaboradores";
import SetoresEquipes from "./pages/SetoresEquipes";

function App() {
  return (
    <div className="App bg-neutral-950 min-h-screen">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/devices" element={<ProtectedRoute><ConnectDevices /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/relatorio" element={<ProtectedRoute><MeuRelatorio /></ProtectedRoute>} />
            <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />

            {/* Área de Gestão */}
            <Route path="/gestor" element={<GestorRoute><GestorDashboard /></GestorRoute>} />
            <Route path="/gestor" element={<GestaoLayout />}>
              <Route path="colaboradores" element={<GestaoColaboradores />} />
              <Route path="setores" element={<SetoresEquipes />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
