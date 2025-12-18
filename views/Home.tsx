import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, Tractor, Loader2, PlusCircle, FileText, Eye, Trash2 } from 'lucide-react';
import { ParcelSummary } from '../types';
import { getParcelsWithLatestCampaignStatus, deleteParcel } from '../services/dataService';
import { useLanguage } from '../contexts/LanguageContext';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [parcels, setParcels] = useState<ParcelSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleDelete = async (parcelId: string) => {
        if (confirmDeleteId !== parcelId) {
            setConfirmDeleteId(parcelId);
            return;
        }

        setDeletingId(parcelId);
        try {
            await deleteParcel(parcelId);
            setParcels(prev => prev.filter(p => p.id !== parcelId));
        } catch (error) {
            console.error('Error deleting parcel:', error);
            alert(t('common.error'));
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const data = await getParcelsWithLatestCampaignStatus();
                if (isMounted) {
                    setParcels(data);
                    setLoading(false);
                }
            } catch (e) {
                console.error("Failed to load parcels", e);
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="p-4 space-y-4 pb-24 relative min-h-full">
            <section className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-primary-500" />
                    </div>
                ) : parcels.length === 0 ? (
                    <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center space-y-4 border-dashed border-2 border-primary-200 mt-8">
                        <div className="bg-primary-50 p-4 rounded-full">
                            <Tractor size={40} className="text-primary-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-primary-800">{t('home.startMapping')}</h3>
                            <p className="text-sm text-primary-600 mt-2">{t('home.registerFirst')}</p>
                        </div>
                        <button
                            onClick={() => navigate('/field-editor')}
                            className="mt-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center space-x-2"
                        >
                            <Plus size={18} />
                            <span>{t('home.createFirst')}</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-primary-800/60">{t('home.activeLots')}</h3>
                            <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-bold">{parcels.length}</span>
                        </div>
                        <div className="space-y-2">
                            {parcels.map(parcel => (
                                <div
                                    key={parcel.id}
                                    onClick={() => navigate(`/field/${parcel.id}`)}
                                    className="glass-panel p-3 rounded-xl cursor-pointer hover:bg-white/60 transition-all active:scale-[0.98]"
                                >
                                    {/* Header: Icon, Name, Badge */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
                                                <LayoutGrid size={16} className="text-primary-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-semibold text-sm text-primary-900 truncate">{parcel.name}</h4>
                                                <p className="text-[11px] text-primary-600">{parcel.area_hectares.toFixed(1)} ha • {parcel.crop}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0 ${parcel.latest_campaign_status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                            parcel.latest_campaign_status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {parcel.latest_campaign_status === 'completed' ? t('home.ready') :
                                                parcel.latest_campaign_status === 'in_progress' ? t('home.progress') : t('home.new')}
                                        </div>
                                    </div>

                                    {/* Actions Row */}
                                    <div className="mt-2 flex items-center gap-1.5">
                                        {parcel.latest_campaign_status === 'completed' ? (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/field/${parcel.id}`);
                                                    }}
                                                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm transition-colors"
                                                >
                                                    <PlusCircle size={12} />
                                                    <span>{t('home.new')}</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (parcel.latest_campaign_id) {
                                                            navigate(`/field-results/${parcel.latest_campaign_id}`);
                                                        }
                                                    }}
                                                    className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm transition-colors"
                                                >
                                                    <FileText size={12} />
                                                    <span>{t('home.report')}</span>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex-1">
                                                <div className="flex justify-between text-[10px] text-primary-600 mb-0.5">
                                                    <span>{t('home.progress')}</span>
                                                    <span className="font-bold">{parcel.sampled_points_count}/{parcel.total_points_count}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                                                    <div
                                                        className="bg-primary-500 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${((parcel.sampled_points_count || 0) / (parcel.total_points_count || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/field/${parcel.id}`);
                                            }}
                                            className="p-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors"
                                            title={t('home.viewDetail')}
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(parcel.id);
                                            }}
                                            disabled={deletingId === parcel.id}
                                            className={`p-1.5 rounded-lg transition-colors ${confirmDeleteId === parcel.id
                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                : 'bg-red-50 hover:bg-red-100 text-red-500'
                                                }`}
                                            title={confirmDeleteId === parcel.id ? t('home.deleteConfirm') : t('home.deleteTitle')}
                                        >
                                            {deletingId === parcel.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>

            {/* FAB: Add Field */}
            <div className="fixed bottom-24 z-20 w-full max-w-[420px] left-1/2 -translate-x-1/2 px-4 pointer-events-none flex justify-end">
                <button
                    onClick={() => navigate('/field-editor')}
                    className="w-14 h-14 flex items-center justify-center bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-500 hover:shadow-xl transition-all active:scale-95 pointer-events-auto"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};