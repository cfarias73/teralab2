
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';
import PWAInstallModal from '../components/PWAInstallModal';

type AuthMode = 'signin' | 'signup' | 'forgot_password' | 'reset_password';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Check if we're in password reset mode (user clicked the email link)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'recovery') {
      setMode('reset_password');
      // Set the session from the recovery token
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get('refresh_token') || ''
      });
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'user'
            }
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: '¡Registro exitoso! Revisa tu correo para confirmar.' });
        setMode('signin');
      } else if (mode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/auth'
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Enlace de recuperación enviado a tu correo.' });
      } else if (mode === 'reset_password') {
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage({ type: 'success', text: '¡Contraseña actualizada! Redirigiendo...' });
        // Clear hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ocurrió un error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[90vh] px-6 pt-16">

      {/* Logo & Branding */}
      <div className="mb-5 text-center animate-in slide-in-from-top-5 duration-500">
        <div className="bg-primary-100 p-3 rounded-full inline-block mb-2 shadow-lg shadow-primary-500/20 border border-primary-200">
          <img src="/logo.png" alt="TeraLab Logo" className="w-8 h-8 object-contain" />
        </div>
        <h1 className="text-xl font-bold text-primary-900 tracking-tight">teralab</h1>
      </div>

      {/* Glass Card */}
      <div className="w-full max-w-sm glass-panel p-8 rounded-3xl shadow-xl border-t border-white/80 animate-in zoom-in-95 duration-500">

        {mode === 'reset_password' ? (
          // Reset Password Mode
          <>
            <div className="text-center mb-6">
              <div className="bg-primary-100 p-3 rounded-full inline-block mb-3">
                <KeyRound size={24} className="text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-primary-900">Nueva Contraseña</h2>
              <p className="text-sm text-primary-600 mt-1">Ingresa tu nueva contraseña</p>
            </div>
          </>
        ) : (
          <div className="mb-6 flex justify-center space-x-4 border-b border-primary-100 pb-2">
            <button
              onClick={() => { setMode('signin'); setMessage(null); }}
              className={`pb-2 text-sm font-bold transition-all ${mode === 'signin' ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setMode('signup'); setMessage(null); }}
              className={`pb-2 text-sm font-bold transition-all ${mode === 'signup' ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Registrarse
            </button>
          </div>
        )}

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {message.type === 'error' ? <AlertCircle size={16} className="mr-2" /> : <CheckCircle size={16} className="mr-2" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">

          {mode === 'signup' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-left-2">
              <label className="text-xs font-bold text-primary-800 ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={18} />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-primary-900 placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          {mode !== 'reset_password' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary-800 ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-primary-900 placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {(mode === 'signin' || mode === 'signup' || mode === 'reset_password') && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary-800 ml-1">
                {mode === 'reset_password' ? 'Nueva Contraseña' : 'Contraseña'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={18} />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-primary-900 placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          {mode === 'reset_password' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-left-2">
              <label className="text-xs font-bold text-primary-800 ml-1">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={18} />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-primary-900 placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-600/30 flex items-center justify-center transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                {mode === 'signin' && 'Ingresar'}
                {mode === 'signup' && 'Crear Cuenta'}
                {mode === 'forgot_password' && 'Enviar Correo'}
                {mode === 'reset_password' && 'Actualizar Contraseña'}
                {!loading && <ArrowRight size={18} className="ml-2" />}
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          {mode === 'signin' && (
            <button
              onClick={() => { setMode('forgot_password'); setMessage(null); }}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium underline decoration-primary-300 underline-offset-2"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
          {mode === 'forgot_password' && (
            <button
              onClick={() => { setMode('signin'); setMessage(null); }}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              Volver al inicio de sesión
            </button>
          )}
        </div>

      </div>

      <p className="mt-8 text-xs text-primary-800/60 font-medium">
        TeraLab AI © 2024
      </p>

      {/* PWA Install Modal */}
      <PWAInstallModal />
    </div>
  );
};
