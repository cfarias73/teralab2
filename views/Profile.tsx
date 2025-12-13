
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { LogOut, User, Mail, Shield, MessageCircle } from 'lucide-react';

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
                    <Shield size={10} className="mr-1" />
                    {loading ? "..." : profile?.role || "user"}
                </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold uppercase text-gray-500 border-b border-gray-200 pb-2">Seguridad</h3>

                <button
                    onClick={async () => {
                        if (!user?.email) return;
                        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                            redirectTo: window.location.origin + '/auth'
                        });
                        if (error) {
                            alert('Error al enviar el correo: ' + error.message);
                        } else {
                            alert('Se ha enviado un correo para cambiar tu contraseña.');
                        }
                    }}
                    className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
                >
                    <div className="flex items-center space-x-3">
                        <div className="bg-primary-50 p-2 rounded-lg text-primary-600">
                            <Shield size={16} />
                        </div>
                        <div className="text-left">
                            <span className="block text-sm font-medium text-gray-800">Cambiar Contraseña</span>
                            <span className="block text-[11px] text-gray-500">Recibe un correo para resetear</span>
                        </div>
                    </div>
                    <Mail size={16} className="text-gray-400" />
                </button>
            </div>

            <a
                href="mailto:teralabmx@gmail.com"
                className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/80 transition-colors"
            >
                <div className="flex items-center space-x-3">
                    <div className="bg-primary-50 p-2 rounded-lg text-primary-600">
                        <MessageCircle size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-800">Contacto</h4>
                        <p className="text-[11px] text-primary-600">teralabmx@gmail.com</p>
                    </div>
                </div>
                <Mail size={16} className="text-gray-400" />
            </a>

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
