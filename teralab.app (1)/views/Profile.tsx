
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { LogOut, User, Mail, Shield, AlertTriangle } from 'lucide-react';

export const Profile: React.FC = () => {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (!error) {
                    setProfile(data);
                }
                setLoading(false);
            };
            fetchProfile();
        }
    }, [user]);

    if (!user) return null;

    return (
        <div className="p-6 space-y-6">
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center space-y-3 relative overflow-hidden">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                     <User size={32} className="text-primary-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-primary-900">
                        {loading ? "Cargando..." : profile?.full_name || "Usuario"}
                    </h2>
                    <p className="text-sm text-primary-600">{user.email}</p>
                </div>
                <div className="px-3 py-1 bg-primary-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center shadow-md">
                    <Shield size={10} className="mr-1"/>
                    {loading ? "..." : profile?.role || "user"}
                </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase text-gray-500 border-b border-gray-200 pb-2">Información de Cuenta</h3>
                
                <div className="flex items-center space-x-3 text-sm">
                    <div className="bg-white p-2 rounded-lg text-primary-500 shadow-sm"><Mail size={16}/></div>
                    <div>
                        <span className="block text-xs text-gray-500">Correo Electrónico</span>
                        <span className="font-medium text-gray-800">{user.email}</span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-3 text-sm">
                     <div className="bg-white p-2 rounded-lg text-primary-500 shadow-sm"><Shield size={16}/></div>
                     <div>
                        <span className="block text-xs text-gray-500">ID de Usuario</span>
                        <span className="font-mono text-[10px] text-gray-600 break-all">{user.id}</span>
                     </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start space-x-3">
                 <AlertTriangle className="text-amber-500 flex-shrink-0" size={20}/>
                 <div>
                     <h4 className="text-sm font-bold text-amber-800">Versión Beta</h4>
                     <p className="text-xs text-amber-700 mt-1">
                         Los datos locales (historial) están guardados en tu dispositivo. Próximamente se sincronizarán en la nube.
                     </p>
                 </div>
            </div>

            <button 
                onClick={signOut}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-xl border border-red-200 shadow-sm flex items-center justify-center transition-all active:scale-95"
            >
                <LogOut size={18} className="mr-2" />
                Cerrar Sesión
            </button>
        </div>
    );
};
