import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Brain, Mail, Lock, User, Calendar, AlertCircle, Building2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    data_nascimento: '',
    setor: 'Geral',
    nivel_acesso: 'User',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Brain className="w-10 h-10 text-cyan-400" />
          <h1 className="text-3xl font-black tracking-tighter text-white font-heading">
            VitalFlow
          </h1>
        </div>

        {/* Card */}
        <div className="border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-2" data-testid="register-title">Criar Conta Pessoal</h2>
          <p className="text-neutral-400 text-sm mb-6">Cadastre-se para monitorar sua saude e bem-estar</p>

          {/* Corporate Notice */}
          <div className="mb-5 p-3 rounded-md bg-amber-500/5 border border-amber-500/20 flex items-start gap-2" data-testid="corporate-notice">
            <Building2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80">
              Se voce faz parte de uma empresa, solicite ao gestor/RH que realize seu cadastro pelo Painel Web. 
              Este formulario e exclusivo para contas pessoais.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-500" data-testid="register-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-neutral-300">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  id="nome"
                  type="text"
                  placeholder="Joao Silva"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="pl-10 bg-neutral-950 border-white/20 text-white focus:border-cyan-400"
                  required
                  data-testid="register-nome"
                />
              </div>
            </div>

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
                  data-testid="register-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-300">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-11 bg-neutral-950 border-white/20 text-white focus:border-cyan-400"
                  required
                  minLength={6}
                  data-testid="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-cyan-400 transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  data-testid="toggle-register-password"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_nascimento" className="text-neutral-300">Data de Nascimento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  className="pl-10 bg-neutral-950 border-white/20 text-white focus:border-cyan-400"
                  required
                  data-testid="register-data-nascimento"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              data-testid="register-submit"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">
              Ja tem uma conta?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold" data-testid="login-link">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
