import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Mail, Lock, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';

// MUDANÇA: Usando a URL dinâmica para falar com o Railway
const API_URL = process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app";

const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const traduzirErro = (msg) => {
  const m = msg.toLowerCase();
  if (m.includes('value is not a valid email')) return 'Por favor, insira um e-mail válido (ex: nome@exemplo.com)';
  if (m.includes('field required')) return 'Este campo é obrigatório';
  if (m.includes('incorrect') || m.includes('invalid credentials')) return 'E-mail ou senha incorretos';
  return msg;
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/');
    } else {
      setError(traduzirErro(result.error));
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotResult(null);
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/forgot-password`, { email: forgotEmail });
      setForgotResult(data);
      toast.success('Senha temporária gerada com sucesso!');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erro ao recuperar senha.';
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <Brain className="w-10 h-10 text-cyan-400" />
          <h1 className="text-3xl font-black tracking-tighter text-white font-heading">
            VitalFlow
          </h1>
        </div>

        <div className="border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-lg p-8">
          <AnimatePresence mode="wait">
            {!showForgot ? (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo</h2>
                <p className="text-neutral-400 text-sm mb-6">Entre com suas credenciais</p>

                {error && (
                  <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-500">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-neutral-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 bg-neutral-950 border-white/20 text-white focus:border-cyan-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-neutral-300">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="********"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 bg-neutral-950 border-white/20 text-white focus:border-cyan-400"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => { setShowForgot(true); setError(''); }}
                    className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-neutral-400">
                    Não tem uma conta?{' '}
                    <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                      Cadastre-se
                    </Link>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-2 mb-4">
                  <KeyRound className="w-6 h-6 text-amber-400" />
                  <h2 className="text-xl font-bold text-white">Recuperar Senha</h2>
                </div>
                <p className="text-neutral-400 text-sm mb-6">
                  Informe seu email cadastrado para receber uma senha temporária.
                </p>

                {forgotResult ? (
                  <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <p className="text-sm font-semibold text-emerald-400">Senha redefinida!</p>
                    </div>
                    <p className="text-xs text-neutral-300 mb-2">{forgotResult.message}</p>
                    <div className="bg-neutral-800 rounded-md px-3 py-2">
                      <p className="text-xs text-neutral-400">Sua nova senha temporária:</p>
                      <p className="text-lg font-mono font-bold text-white mt-1">{forgotResult.temp_password}</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-neutral-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="pl-10 bg-neutral-950 border-white/20 text-white focus:border-cyan-400"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                    >
                      {forgotLoading ? 'Enviando...' : 'Recuperar Senha'}
                    </Button>
                  </form>
                )}

                <div className="mt-4 text-center">
                  <button
                    onClick={() => { setShowForgot(false); setForgotResult(null); setForgotEmail(''); }}
                    className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Voltar ao Login
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;