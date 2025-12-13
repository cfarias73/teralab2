import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, Tractor, Loader2, PlusCircle, FileText } from 'lucide-react';
import { ParcelSummary } from '../types';
import { getParcelsWithLatestCampaignStatus } from '../services/dataService';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [parcels, setParcels] = useState<ParcelSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        try {
            const data = await getParcelsWithLatestCampaignStatus();
            setParcels(data);
        } catch (e) {
            console.error("Failed to load parcels", e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  return (
    <div className="p-4 space-y-6 pb-24 relative min-h-full">
      {/* Dashboard Header */}
      <div className="glass-panel p-6 rounded-2xl">
        <h1 className="text-2xl font-bold text-primary-900 mb-1">Mis Campos</h1>
        <p className="text-sm text-primary-700">Selecciona un campo para analizar o crea uno nuevo.</p>
      </div>

      {/* Campaigns List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary-800/60">Lotes Activos</h3>
            <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-bold">{parcels.length}</span>
        </div>

        {loading ? (
            <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary-500" />
            </div>
        ) : parcels.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center space-y-4 border-dashed border-2 border-primary-200">
                <div className="bg-primary-50 p-4 rounded-full">
                    <Tractor size={32} className="text-primary-400" />
                </div>
                <div>
                    <h3 className="font-bold text-primary-800">No hay lotes registrados</h3>
                    <p className="text-sm text-primary-600 mt-1">Crea tu primer campo para comenzar el análisis.</p>
                </div>
            </div>
        ) : (
            <div className="space-y-3">
                {parcels.map(parcel => (
                    <div 
                        key={parcel.id}
                        onClick={() => navigate(`/field/${parcel.id}`)}
                        className="glass-panel p-4 rounded-xl cursor-pointer hover:bg-white/60 transition-all active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                <div className="bg-primary-100 p-2.5 rounded-lg">
                                    <LayoutGrid size={20} className="text-primary-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary-900">{parcel.name}</h4>
                                    <p className="text-xs text-primary-600">{parcel.area_hectares.toFixed(1)} ha • {parcel.crop}</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                parcel.latest_campaign_status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                parcel.latest_campaign_status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {parcel.latest_campaign_status === 'completed' ? 'Completado' : parcel.latest_campaign_status === 'in_progress' ? 'En Progreso' : 'Análisis'}
                            </div>
                        </div>
                        
                        {/* Action Area or Progress Bar */}
                        <div className="mt-4">
                            {parcel.latest_campaign_status === 'completed' ? (
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Al ir al Overview, si el último está completado, aparecerá el botón grande de "Nuevo Análisis"
                                            navigate(`/field/${parcel.id}`);
                                        }}
                                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 shadow-sm transition-colors"
                                    >
                                        <PlusCircle size={14} />
                                        <span>Nuevo Análisis</span>
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (parcel.latest_campaign_id) {
                                                navigate(`/field-results/${parcel.latest_campaign_id}`);
                                            }
                                        }}
                                        className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 shadow-sm transition-colors"
                                    >
                                        <FileText size={14} />
                                        <span>Ver Reporte</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between text-[10px] text-primary-600 mb-1">
                                        <span>Progreso Muestreo</span>
                                        <span className="font-bold">{parcel.sampled_points_count}/{parcel.total_points_count}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-primary-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${((parcel.sampled_points_count || 0) / (parcel.total_points_count || 1)) * 100}%`}}
                                        ></div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </section>

      {/* FAB: Add Field */}
      <div className="fixed bottom-24 z-20 w-full max-w-[380px] left-1/2 -translate-x-1/2 px-4 pointer-events-none flex justify-end">
         <button 
            onClick={() => navigate('/field-editor')}
            className="flex items-center space-x-2 bg-primary-600 text-white px-5 py-3 rounded-full shadow-glass-hover hover:bg-primary-500 transition-all active:scale-95 pointer-events-auto"
         >
            <Plus size={20} />
            <span className="font-bold">Nuevo Campo</span>
         </button>
      </div>

    </div>
  );
};