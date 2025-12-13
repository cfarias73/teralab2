
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'forgot_password';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

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
            redirectTo: window.location.origin + '/#/profile' // Redirect to profile to set new password
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Enlace de recuperación enviado a tu correo.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ocurrió un error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      
      {/* Logo & Branding */}
      <div className="mb-8 text-center animate-in slide-in-from-top-5 duration-500">
        <div className="bg-primary-100 p-4 rounded-full inline-block mb-4 shadow-lg shadow-primary-500/20 border border-primary-200">
          {/* Reemplazado Leaf por la imagen del logo */}
          <img src="/logo.png" alt="AI SoilCheck Logo" className="w-10 h-10 object-contain" />
        </div>
        <h1 className="text-3xl font-bold text-primary-900 tracking-tight">AI SoilCheck</h1>
        <p className="text-primary-700 mt-2 font-medium">Agricultura de Precisión en tu Bolsillo</p>
      </div>

      {/* Glass Card */}
      <div className="w-full max-w-sm glass-panel p-8 rounded-3xl shadow-xl border-t border-white/80 animate-in zoom-in-95 duration-500">
        
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

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {message.type === 'error' ? <AlertCircle size={16} className="mr-2"/> : <CheckCircle size={16} className="mr-2"/>}
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

          {mode !== 'forgot_password' && (
            <div className="space-y-1">
                <label className="text-xs font-bold text-primary-800 ml-1">Contraseña</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={18} />
                    <input 
                        type="password" 
                        required 
                        className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-primary-900 placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
    </div>
  );
};
