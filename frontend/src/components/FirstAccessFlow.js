import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Shield, Check, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app"}/api`;

const FirstAccessFlow = ({ user, onComplete }) => {
  const [step, setStep] = useState(user?.must_change_password ? "password" : "lgpd");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Senha deve ter no minimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas nao coincidem.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/change-password`, { new_password: newPassword }, { withCredentials: true });
      toast.success("Senha alterada com sucesso!");
      if (user?.must_accept_lgpd) {
        setStep("lgpd");
      } else {
        onComplete();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao alterar senha.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptLgpd = async () => {
    if (!lgpdAccepted) return;
    setLoading(true);
    try {
      await axios.post(`${API}/auth/accept-lgpd`, {}, { withCredentials: true });
      toast.success("Termos aceitos!");
      onComplete();
    } catch (err) {
      toast.error("Erro ao aceitar termos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md" data-testid="first-access-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden"
      >
        {/* Progress */}
        <div className="h-1 bg-neutral-800 w-full">
          <div className={`h-full bg-cyan-500 transition-all duration-500 ${step === "password" ? "w-1/2" : "w-full"}`} />
        </div>

        <div className="p-8">
          {step === "password" ? (
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-1" data-testid="change-password-title">
                Altere sua senha
              </h2>
              <p className="text-sm text-neutral-400 mb-6">
                Sua conta foi criada pelo RH da sua empresa. Por seguranca, defina uma nova senha pessoal.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Nova senha</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 6 caracteres"
                    className="bg-neutral-950 border-white/20 text-white"
                    required
                    minLength={6}
                    data-testid="new-password-input"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Confirmar senha</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="bg-neutral-950 border-white/20 text-white"
                    required
                    data-testid="confirm-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                  data-testid="change-password-submit"
                >
                  {loading ? "Alterando..." : "Definir Nova Senha"}
                </Button>
              </form>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-1" data-testid="lgpd-title">
                Termos de Privacidade
              </h2>
              <p className="text-sm text-neutral-400 mb-5">
                Para utilizar o VitalFlow, leia e aceite os termos abaixo.
              </p>

              <div className="bg-neutral-950 border border-white/10 rounded-md p-4 max-h-48 overflow-y-auto text-xs text-neutral-300 leading-relaxed mb-5 space-y-2" data-testid="lgpd-terms">
                <p className="font-bold text-white">Termos de Uso e Politica de Privacidade — VitalFlow</p>
                <p>1. <strong>Coleta de Dados:</strong> O VitalFlow coleta dados biometricos (frequencia cardiaca, variabilidade cardiaca, qualidade do sono e nivel de atividade) exclusivamente para gerar indicadores de bem-estar.</p>
                <p>2. <strong>Uso dos Dados:</strong> Seus dados sao utilizados para calcular o V-Score e gerar sugestoes de rotina personalizadas. Nenhum dado e vendido ou compartilhado com terceiros.</p>
                <p>3. <strong>Anonimizacao B2B:</strong> Em ambiente corporativo, o gestor/RH visualiza apenas dados agregados e anonimizados da equipe, conforme a Lei 14.831/2024.</p>
                <p>4. <strong>Armazenamento:</strong> Seus dados sao armazenados com criptografia e podem ser excluidos a qualquer momento mediante solicitacao.</p>
                <p>5. <strong>Disclaimer:</strong> O VitalFlow e uma ferramenta de suporte ao bem-estar e nao substitui consulta medica profissional.</p>
                <p>6. <strong>LGPD:</strong> Este servico esta em conformidade com a Lei Geral de Protecao de Dados (Lei 13.709/2018). Voce tem direito a acesso, correcao e exclusao dos seus dados pessoais.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input
                  type="checkbox"
                  checked={lgpdAccepted}
                  onChange={(e) => setLgpdAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-cyan-500"
                  data-testid="lgpd-checkbox"
                />
                <span className="text-sm text-neutral-300">
                  Li e aceito os Termos de Uso e a Politica de Privacidade do VitalFlow, conforme a LGPD.
                </span>
              </label>

              <Button
                onClick={handleAcceptLgpd}
                disabled={!lgpdAccepted || loading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold disabled:opacity-40"
                data-testid="accept-lgpd-submit"
              >
                {loading ? "Processando..." : "Aceitar e Continuar"}
              </Button>
            </div>
          )}

          <div className="mt-4 p-3 rounded-md bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/70">
              O VitalFlow e uma ferramenta de suporte ao bem-estar e nao substitui consulta medica profissional.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FirstAccessFlow;
