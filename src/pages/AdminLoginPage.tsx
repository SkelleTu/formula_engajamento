import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingIcons from '../components/FloatingIcons';
import BackButton from '../components/BackButton';
import { apiUrl } from '../config/api';
import { HttpLogger } from '../utils/httpLogger';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('%c🚀 INICIANDO LOGIN', 'background: #4f46e5; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold');

    try {
      const response = await HttpLogger.loggedFetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        console.log('%c❌ LOGIN FALHOU', 'background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold');
        console.log('Erro retornado:', data.error);
        setError(data.error || 'Erro ao fazer login');
        setLoading(false);
        return;
      }

      // Verificar se precisa trocar senha
      if (data.requiresPasswordChange) {
        console.log('%c⚠️ REQUER TROCA DE SENHA', 'background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold');
        setShowPasswordChange(true);
        setLoading(false);
        return;
      }

      // Login bem-sucedido
      console.log('%c✅ LOGIN BEM-SUCEDIDO', 'background: #16a34a; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold');
      console.log('Redirecionando para dashboard...');
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.log('%c💥 ERRO CRÍTICO NO LOGIN', 'background: #991b1b; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold');
      console.error('Detalhes do erro:', err);
      setError('Erro ao conectar com o servidor: ' + err.message);
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');

    if (newPassword.length < 6) {
      setChangePasswordError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const response = await HttpLogger.loggedFetch(apiUrl('/api/admin/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: password,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setChangePasswordError(data.error || 'Erro ao trocar senha');
        setLoading(false);
        return;
      }

      // Senha trocada com sucesso - navegar para dashboard
      navigate('/admin/dashboard');
    } catch (err: any) {
      setChangePasswordError('Erro ao conectar com o servidor: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <FloatingIcons />
      
      <BackButton onClick={() => navigate('/')} className="absolute top-6 left-6 z-20" />
      
      <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Painel Administrativo</h1>
          <p className="text-purple-200">Acesso restrito aos proprietários</p>
        </div>

        {!showPasswordChange ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-purple-200 mb-2">
                Nome de Usuário
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="seu_usuario"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-2">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-100 px-4 py-3 rounded-lg mb-4">
              <p className="font-semibold">Bem-vindo, {username}!</p>
              <p className="text-sm mt-1">Por favor, defina sua senha permanente.</p>
            </div>

            {changePasswordError && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg">
                {changePasswordError}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-purple-200 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-purple-200 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Digite a senha novamente"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Definir Senha'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-purple-300 text-sm">
          <p>Sistema de Analytics - Fórmula Engajamento</p>
          <p className="text-purple-400/60 text-xs mt-2">CNPJ: 57.579.277/0001-38</p>
        </div>
      </div>
    </div>
  );
}
