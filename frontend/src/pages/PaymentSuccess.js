import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    const checkStatus = async () => {
      try {
        const { data } = await axios.get(
          `${API}/billing/checkout-status/${sessionId}`,
          { withCredentials: true }
        );
        if (data.payment_status === "paid") {
          setStatus("paid");
          refreshUser();
        } else if (data.status === "expired") {
          setStatus("expired");
        } else {
          setStatus("pending");
          setTimeout(checkStatus, 3000);
        }
      } catch {
        setStatus("error");
      }
    };
    checkStatus();
  }, [sessionId, refreshUser]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-xl p-8 text-center" data-testid="payment-result">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Processando pagamento...</h2>
            <p className="text-sm text-neutral-400">Aguarde enquanto confirmamos seu upgrade.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-emerald-400 mb-2" data-testid="payment-success-title">
              Premium Ativado!
            </h2>
            <p className="text-sm text-neutral-300 mb-6">
              Seu upgrade para o plano Premium foi confirmado. Todas as funcionalidades avancadas
              estao liberadas.
            </p>
            <button
              onClick={() => navigate("/")}
              data-testid="back-to-dashboard"
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-md transition-all"
            >
              Voltar ao Dashboard
            </button>
          </>
        )}
        {status === "pending" && (
          <>
            <Loader2 className="w-16 h-16 text-amber-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-amber-400 mb-2">Pagamento pendente</h2>
            <p className="text-sm text-neutral-400">Estamos aguardando a confirmacao. Isso pode levar alguns segundos...</p>
          </>
        )}
        {(status === "error" || status === "expired") && (
          <>
            <XCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-rose-400 mb-2">
              {status === "expired" ? "Sessao expirada" : "Erro no pagamento"}
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              {status === "expired"
                ? "A sessao de pagamento expirou. Tente novamente."
                : "Ocorreu um erro ao processar seu pagamento."}
            </p>
            <button
              onClick={() => navigate("/")}
              data-testid="back-to-dashboard-error"
              className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-md transition-all"
            >
              Voltar ao Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
