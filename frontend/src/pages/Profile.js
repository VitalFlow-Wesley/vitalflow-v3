import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { User, Calendar, Camera, Save, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    data_nascimento: user?.data_nascimento || '',
    foto_base64: null,
  });
  const [previewUrl, setPreviewUrl] = useState(user?.foto_url || null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        // Convert to base64 (remove data:image/...;base64, prefix)
        const base64 = reader.result.split(',')[1];
        setFormData({ ...formData, foto_base64: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updateData = {};
    if (formData.nome !== user.nome) {
      updateData.nome = formData.nome;
    }
    if (formData.data_nascimento !== user.data_nascimento) {
      updateData.data_nascimento = formData.data_nascimento;
    }
    if (formData.foto_base64) {
      updateData.foto_base64 = formData.foto_base64;
    }

    const result = await updateProfile(updateData);

    if (result.success) {
      toast.success('Perfil atualizado com sucesso!');
    } else {
      toast.error(result.error || 'Erro ao atualizar perfil');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar onOpenForm={() => {}} />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white font-heading">
            Meu Perfil
          </h1>
          <p className="text-neutral-400 mt-2">
            Gerencie suas informações pessoais
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-lg p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-2 border-white/20 overflow-hidden bg-neutral-800">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-neutral-600" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="foto"
                  className="absolute bottom-0 right-0 w-10 h-10 bg-cyan-500 hover:bg-cyan-400 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Camera className="w-5 h-5 text-black" />
                  <input
                    id="foto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="photo-upload"
                  />
                </label>
              </div>
              <p className="text-xs text-neutral-500">Clique no ícone para alterar a foto</p>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-neutral-300">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="pl-10 bg-neutral-950 border-white/20 text-white focus:border-cyan-400"
                    required
                    data-testid="input-nome"
                  />
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
                    data-testid="input-data-nascimento"
                  />
                </div>
              </div>

              {/* Read-only fields */}
              <div className="space-y-2">
                <Label className="text-neutral-300">Email</Label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-neutral-950/50 border-white/10 text-neutral-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300">Setor</Label>
                <Input
                  type="text"
                  value={user?.setor || ''}
                  disabled
                  className="bg-neutral-950/50 border-white/10 text-neutral-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300">Nível de Acesso</Label>
                <Input
                  type="text"
                  value={user?.nivel_acesso || ''}
                  disabled
                  className="bg-neutral-950/50 border-white/10 text-neutral-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8"
                data-testid="save-profile-button"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="border border-white/5 bg-neutral-900/40 rounded-md p-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Informações da Conta
            </h3>
            <p className="text-xs text-neutral-500">
              Cadastrado em: {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>

          <div className="border border-white/5 bg-neutral-900/40 rounded-md p-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Privacidade
            </h3>
            <p className="text-xs text-neutral-500">
              Seus dados são protegidos e criptografados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
