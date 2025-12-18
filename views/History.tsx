
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnalysisResult, FieldCampaign } from '../types';
import { getAnalyses, getCampaigns, getAnalysesByCampaign, clearHistory } from '../services/dataService';
import { ChevronRight, Calendar, AlertCircle, ArrowLeft, LayoutGrid, CheckCircle, FileText, Leaf, Sprout, Loader2 } from 'lucide-react';

type HistoryItem =
    | { type: 'campaign'; data: FieldCampaign; date: string }
    | { type: 'analysis'; data: AnalysisResult; date: string };

export const History: React.FC = () => {
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageTitle, setPageTitle] = useState('Historial');

    const navigate = useNavigate();
    const location = useLocation();
    const campaignId = location.state?.campaignId;

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (campaignId) {
                    // Fetch specific campaign history
                    const analyses = await getAnalysesByCampaign(campaignId);
                    const allCampaigns = await getCampaigns();
                    const currentCampaign = allCampaigns.find(c => c.id === campaignId);

                    if (currentCampaign) {
                        setPageTitle(`Puntos: ${currentCampaign.parcel.name}`);
                    }

                    const items: HistoryItem[] = analyses.map(a => ({
                        type: 'analysis' as const,
                        data: a,
                        date: a.timestamp
                    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    setHistoryItems(items);
                } else {
                    // Main Mode
                    setPageTitle('Historial General');
                    const [allAnalyses, allCampaigns] = await Promise.all([
                        getAnalyses(),
                        getCampaigns()
                    ]);

                    const items: HistoryItem[] = [];

                    // 1. Add Campaigns
                    allCampaigns.forEach(c => {
                        if (c.status !== 'planning') {
                            items.push({
                                type: 'campaign',
                                data: c,
                                date: c.last_updated || c.created_at
                            });
                        }
                    });

                    // 2. Add Standalone Analyses (or all analyses for now, simplistic view)
                    allAnalyses.forEach(a => {
                        if (!a.sampling_point_id) {
                            items.push({
                                type: 'analysis',
                                data: a,
                                date: a.timestamp
                            });
                        }
                    });

                    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setHistoryItems(items);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [campaignId]);

    const handleClear = async () => {
        if (confirm("¿Borrar todo el historial? Esto eliminará todos los análisis.")) {
            try {
                await clearHistory();
                window.location.reload();
            } catch (e) {
                alert("Error al borrar historial.");
            }
        }
    };

    const findPointLabel = (analysis: AnalysisResult): string => {
        if (analysis.original_input.notes && analysis.original_input.notes.includes('Punto')) {
            return analysis.original_input.notes;
        }
        return 'Muestra Individual';
    };

    const getRiskBadge = (item: AnalysisResult) => {
        if (item.salinity.severity === 'high') return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center"><AlertCircle size={10} className="mr-1" /> Salinidad</span>;
        if (item.compaction.level === 'high') return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center"><AlertCircle size={10} className="mr-1" /> Compactación</span>;
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center"><CheckCircle size={10} className="mr-1" /> Saludable</span>;
    };

    return (
        <div className="p-4 space-y-3 pb-24">

            {/* Back button only for campaign-specific view */}
            {campaignId && (
                <div className="flex items-center space-x-2 mb-2">
                    <button onClick={() => navigate('/field-results/' + campaignId)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold text-primary-900">{pageTitle}</h1>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary-500" /></div>
            ) : historyItems.length === 0 ? (
                <div className="glass-panel rounded-2xl flex flex-col items-center justify-center h-48 text-primary-400 border-dashed border-2 border-primary-200">
                    <Calendar size={40} className="mb-3 opacity-50" />
                    <p className="font-medium text-sm">No hay registros.</p>
                    <Link to="/" className="mt-3 text-primary-600 font-bold text-xs bg-primary-100 px-4 py-2 rounded-xl hover:bg-primary-200 transition-colors">
                        Nuevo Análisis
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {historyItems.map((item, idx) => {

                        // --- RENDER CAMPAIGN CARD ---
                        if (item.type === 'campaign') {
                            const c = item.data as FieldCampaign;
                            const isComplete = c.status === 'completed';

                            return (
                                <div
                                    key={`camp-${c.id}`}
                                    onClick={() => navigate(isComplete ? `/field-results/${c.id}` : `/campaign/${c.id}`)}
                                    className="glass-panel p-3 rounded-xl cursor-pointer hover:bg-white/80 active:scale-[0.99] transition-all border-l-4 border-l-primary-500 relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {isComplete ? <FileText size={16} /> : <Sprout size={16} />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-primary-900 text-sm">{c.parcel.name}</h3>
                                                <p className="text-[11px] text-primary-600">Reporte de Lote • {c.parcel.crop}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                                {new Date(c.last_updated).toLocaleDateString()}
                                            </span>
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500">
                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{c.points.length} puntos</span>
                                        {isComplete && <span>• {(c.global_analysis?.executive_summary?.overall_health || c.global_analysis?.field_summary?.health_classification || 'ANALIZADO').toUpperCase()}</span>}
                                    </div>
                                </div>
                            );
                        }

                        // --- RENDER ANALYSIS CARD ---
                        const a = item.data as AnalysisResult;
                        return (
                            <div
                                key={`an-${a.id || idx}`}
                                onClick={() => navigate('/results', { state: { result: a } })}
                                className="glass-panel p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-white/60 active:scale-[0.99] transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-primary-900 text-sm">{findPointLabel(a)}</span>
                                            {a.sampling_point_id && (
                                                <span className="text-[9px] bg-primary-50 text-primary-600 px-1 py-0.5 rounded uppercase font-bold">Lote</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(a.timestamp).toLocaleDateString()}
                                            </span>
                                            <span className="text-[11px] text-primary-700 capitalize">
                                                {a.texture.class.replace('_', ' ')}
                                            </span>
                                            {getRiskBadge(a)}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-400" />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
