
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FieldCampaign, AnalysisResult, FieldAnalysisReport } from '../types';
import { generateFieldReport } from '../services/geminiService';
import { saveCampaign, getCampaignById, getAnalysesByCampaign } from '../services/dataService';
import { Loader2, Download, AlertTriangle, Layers, Map as MapIcon, ChevronLeft, Calendar, TrendingUp, FileText, Sprout, CalendarCheck, Activity } from 'lucide-react';

export const FieldResults: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState<FieldCampaign | null>(null);
    const [report, setReport] = useState<FieldAnalysisReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Tabs state
    const [activeTab, setActiveTab] = useState<'report' | 'fertilization'>('report');

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const camp = await getCampaignById(id);
                if (camp) {
                    setCampaign(camp);

                    if (camp.global_analysis) {
                        setReport(camp.global_analysis);
                    } else {
                        // If analysis isn't in campaign object, we might need to generate it
                        // Fetch individual analyses for this campaign
                        const pointAnalyses = await getAnalysesByCampaign(id);

                        if (pointAnalyses.length > 0) {
                            const rep = await generateFieldReport(camp, pointAnalyses);
                            setReport(rep);

                            // Save generated report to DB
                            const updatedCamp = { ...camp, global_analysis: rep };
                            await saveCampaign(updatedCamp);
                        }
                    }
                }
            } catch (e) {
                console.error("Error loading field results:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleDownloadPDF = (type: 'report' | 'fertilization') => {
        if (!report || !campaign) return;
        setIsGeneratingPdf(true);

        const elementId = type === 'report' ? 'pdf-field-report' : 'pdf-field-plan';
        const element = document.getElementById(elementId);

        if (!element) {
            setIsGeneratingPdf(false);
            return;
        }

        element.style.display = 'block';

        const filename = type === 'report'
            ? `Reporte_Lote_${campaign.parcel.name}.pdf`
            : `Plan_Fertilizacion_${campaign.parcel.name}.pdf`;

        const opt = {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // @ts-ignore
        html2pdf().set(opt).from(element).save().then(() => {
            element.style.display = 'none';
            setIsGeneratingPdf(false);
        });
    };

    if (loading || !report || !campaign) return <div className="p-10 flex flex-col items-center justify-center h-full"><Loader2 className="animate-spin text-primary-600 mb-2" /><span className="text-primary-700 font-bold">Generando Informe Global...</span></div>;

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-white/50"><ChevronLeft /></button>
                    <h1 className="font-bold text-xl text-primary-900 truncate max-w-[200px]">{campaign.parcel.name}</h1>
                </div>
                <button
                    onClick={() => navigate('/history', { state: { campaignId: id } })}
                    className="flex items-center space-x-1.5 bg-white/50 text-primary-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white transition-colors"
                >
                    <FileText size={14} />
                    <span>Ver Puntos</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-gray-200/50 p-1 rounded-xl flex space-x-1">
                <button
                    onClick={() => setActiveTab('report')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all ${activeTab === 'report' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
                >
                    <Activity size={16} />
                    <span>Informe</span>
                </button>
                <button
                    onClick={() => setActiveTab('fertilization')}
                    disabled={!report.fertilization_plan}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all ${activeTab === 'fertilization' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:bg-white/50 disabled:opacity-50'}`}
                >
                    <Sprout size={16} />
                    <span>Fertilización</span>
                </button>
            </div>

            {/* --- TAB: REPORT --- */}
            {activeTab === 'report' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    {/* Global Summary */}
                    <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-primary-50">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="font-bold text-primary-900">Resumen Ejecutivo</h2>
                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${report.field_summary.health_classification === 'excellent' ? 'bg-emerald-500' : report.field_summary.health_classification === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}>
                                Salud: {report.field_summary.health_classification.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-sm text-primary-800 leading-relaxed font-light mb-4">
                            {report.final_summary_text}
                        </p>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                            <div className="bg-white/60 p-2 rounded-lg">
                                <span className="block text-xs text-gray-500">Variabilidad</span>
                                <span className="font-bold text-primary-900">{report.field_summary.variability_index}/100</span>
                            </div>
                            <div className="bg-white/60 p-2 rounded-lg">
                                <span className="block text-xs text-gray-500">Suelo Dom.</span>
                                <span className="font-bold text-primary-900 text-xs">{report.field_summary.dominant_soil}</span>
                            </div>
                            <div className="bg-white/60 p-2 rounded-lg">
                                <span className="block text-xs text-gray-500">Problemas</span>
                                <span className="font-bold text-primary-900 text-xs">{report.field_summary.dominant_issues.length} detectados</span>
                            </div>
                        </div>
                    </div>

                    {/* Ranked Problems */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-gray-500">Problemas Prioritarios</h3>
                        {report.field_problems_ranked.map((prob, i) => (
                            <div key={i} className="glass-panel p-4 rounded-xl border-l-4 border-red-400">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-gray-800">{prob.problem}</h4>
                                    <span className="text-xs font-bold text-red-600">Severidad: {prob.severity}</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">Ubicación: {prob.location}</p>
                                <p className="text-xs text-gray-500 italic">Causa: {prob.cause}</p>
                            </div>
                        ))}
                    </section>

                    {/* Action Plan (30/90/365) */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center">
                            <Calendar size={14} className="mr-1" /> Plan de Acción
                        </h3>

                        <div className="space-y-4">
                            {/* 30 Days */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                                <h4 className="font-bold text-emerald-800 text-sm mb-2">Corto Plazo (30 Días)</h4>
                                <ul className="space-y-2">
                                    {report.action_plan["30_days"].map((item: any, i: number) => (
                                        <li key={i} className="text-xs text-gray-700 flex items-start">
                                            <span className="mr-2 text-emerald-500">•</span>
                                            <span>{item.action} <span className="text-gray-400">({item.benefit})</span></span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* 90 Days */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                                <h4 className="font-bold text-blue-800 text-sm mb-2">Mediano Plazo (90 Días)</h4>
                                <ul className="space-y-2">
                                    {report.action_plan["90_days"].map((item: any, i: number) => (
                                        <li key={i} className="text-xs text-gray-700 flex items-start">
                                            <span className="mr-2 text-blue-500">•</span>
                                            <span>{item.action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Zone Breakdown */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-gray-500">Detalle por Zona</h3>
                        {report.zones.map((zoneData, idx) => {
                            const zoneDef = campaign.zones.find(z => z.id === zoneData.zone_id);
                            return (
                                <div key={idx} className="glass-panel p-4 rounded-xl border-l-4" style={{ borderLeftColor: zoneDef?.color }}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-gray-800">{zoneDef?.name}</h4>
                                        <span className="text-[10px] text-gray-500">Var: {zoneData.variability_score}%</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3">{zoneData.summary_text}</p>

                                    <div className="space-y-1">
                                        {zoneData.recommendations_zone.slice(0, 2).map((rec: any, rI: number) => (
                                            <div key={rI} className="text-[10px] bg-white/50 px-2 py-1 rounded flex items-center">
                                                <TrendingUp size={10} className="mr-1 text-primary-600" />
                                                {rec.action}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    <div className="pt-4 border-t border-primary-200/50">
                        <button
                            onClick={() => handleDownloadPDF('report')}
                            disabled={isGeneratingPdf}
                            className="w-full bg-primary-900 hover:bg-primary-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95"
                        >
                            {isGeneratingPdf ? <Loader2 className="animate-spin mr-2" size={18} /> : <FileText size={18} className="mr-2" />}
                            {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Informe Global'}
                        </button>
                    </div>
                </div>
            )}

            {/* --- TAB: FERTILIZATION --- */}
            {activeTab === 'fertilization' && report.fertilization_plan && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="glass-panel p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border-l-4 border-emerald-500">
                        <h3 className="text-xs font-bold text-emerald-800 uppercase mb-3">Fórmula Global Lote</h3>
                        <div className="flex items-start space-x-3 mb-3">
                            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 flex-shrink-0">
                                <Sprout size={20} />
                            </div>
                            <p className="text-sm font-bold text-emerald-900 leading-tight">
                                {report.fertilization_plan.fertilizer_composition.name}
                            </p>
                        </div>
                        <div className="space-y-1 text-xs bg-white/50 p-2 rounded-lg">
                            <div className="flex"><span className="font-bold text-emerald-700 w-8">N:</span><span className="text-emerald-800">{report.fertilization_plan.fertilizer_composition.macro_n}</span></div>
                            <div className="flex"><span className="font-bold text-emerald-700 w-8">P:</span><span className="text-emerald-800">{report.fertilization_plan.fertilizer_composition.macro_p}</span></div>
                            <div className="flex"><span className="font-bold text-emerald-700 w-8">K:</span><span className="text-emerald-800">{report.fertilization_plan.fertilizer_composition.macro_k}</span></div>
                        </div>
                        <p className="text-xs text-emerald-600 mt-2 italic">
                            + {report.fertilization_plan.fertilizer_composition.micro_elements}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary-800/60 px-1">Calendario de Aplicación</h3>
                        {report.fertilization_plan.stages.map((stage, idx) => (
                            <div key={idx} className="glass-panel rounded-xl overflow-hidden">
                                <div className="bg-primary-50/50 p-3 border-b border-primary-100 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-primary-900 text-sm">{stage.stage_name}</h4>
                                        <p className="text-[10px] text-primary-600">{stage.total_days_range}</p>
                                    </div>
                                    <CalendarCheck size={18} className="text-primary-400" />
                                </div>
                                <div className="p-3 space-y-3">
                                    {stage.activities.map((act, aIdx) => (
                                        <div key={aIdx} className="flex space-x-3 text-xs">
                                            <div className="flex-shrink-0 w-16 pt-0.5">
                                                <span className="font-bold text-gray-500 block">{act.days_range}</span>
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-bold text-primary-800">{act.product} <span className="font-normal text-gray-500">({act.action})</span></p>
                                                <div className="flex items-center space-x-2 mt-0.5">
                                                    <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded font-medium">{act.dosage}</span>
                                                    <span className="text-gray-400">• {act.method}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-primary-200/50">
                        <button
                            onClick={() => handleDownloadPDF('fertilization')}
                            disabled={isGeneratingPdf}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95"
                        >
                            {isGeneratingPdf ? <Loader2 className="animate-spin mr-2" size={18} /> : <FileText size={18} className="mr-2" />}
                            {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Plan de Fertilización'}
                        </button>
                    </div>
                </div>
            )}

            {/* PDF Templates (Hidden) - Keeping existing templates from Results.tsx but adapted for Field Report */}
            {/* Same templates as before, just rendering `report` data instead of `detailedReport` */}
            <div id="pdf-field-report" style={{ display: 'none', width: '210mm', minHeight: '297mm', background: 'white', fontFamily: 'Inter, sans-serif' }}>
                <div className="p-8 text-slate-800">
                    <div className="flex justify-between items-center border-b-2 border-primary-600 pb-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-primary-800">AI SoilCheck</h1>
                            <p className="text-sm text-slate-500">Informe Global de Campo</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-slate-800">{new Date(campaign.last_updated).toISOString().split('T')[0]}</p>
                            <p className="text-xs text-slate-500">LOTE: {campaign.parcel.name}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg mb-8">
                        <h2 className="text-lg font-bold text-primary-800 mb-2">Diagnóstico Ejecutivo</h2>
                        <p className="text-sm leading-relaxed text-justify">{report.final_summary_text}</p>
                        <div className="mt-4 flex space-x-4">
                            <span className="px-3 py-1 bg-white border rounded text-xs font-bold">Salud: {report.field_summary.health_classification}</span>
                            <span className="px-3 py-1 bg-white border rounded text-xs font-bold">Suelo: {report.field_summary.dominant_soil}</span>
                        </div>
                    </div>

                    <h2 className="font-bold text-lg mb-4 border-b pb-2">Análisis por Zonas</h2>
                    <div className="space-y-4 mb-8">
                        {report.zones.map((z, i) => (
                            <div key={i} className="border p-4 rounded bg-white">
                                <h3 className="font-bold text-slate-700 text-sm">Zona {campaign.zones.find(zone => zone.id === z.zone_id)?.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">{z.summary_text}</p>
                                <div className="mt-2 text-xs">
                                    <strong>Recomendación:</strong> {z.recommendations_zone[0]?.action}
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2 className="font-bold text-lg mb-4 border-b pb-2">Problemas Detectados</h2>
                    <table className="w-full text-sm border-collapse mb-8">
                        <thead>
                            <tr className="bg-slate-100 text-left"><th className="p-2">Problema</th><th className="p-2">Ubicación</th><th className="p-2">Severidad</th></tr>
                        </thead>
                        <tbody>
                            {report.field_problems_ranked.map((p, i) => (
                                <tr key={i} className="border-b"><td className="p-2">{p.problem}</td><td className="p-2">{p.location}</td><td className="p-2">{p.severity}/100</td></tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-12 pt-4 border-t border-slate-200 text-center">
                        <p className="text-xs text-slate-400">Generado por AI SoilCheck. Documento Global 1 de 2.</p>
                    </div>
                </div>
            </div>

            <div id="pdf-field-plan" style={{ display: 'none', width: '210mm', minHeight: '297mm', background: 'white', fontFamily: 'Inter, sans-serif' }}>
                {report.fertilization_plan && (
                    <div className="relative h-full">
                        <div className="bg-emerald-700 text-white p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold uppercase tracking-wide">Programa de Fertirriego (Lote)</h1>
                                    <p className="text-emerald-200 mt-1 text-lg">{campaign.parcel.crop} | Etapa Productiva</p>
                                </div>
                                <div className="text-right">
                                    <div className="bg-white/20 p-2 rounded backdrop-blur-md">
                                        <p className="font-mono font-bold text-xl">{campaign.parcel.name}</p>
                                        <p className="text-xs text-emerald-100">{campaign.parcel.area_hectares.toFixed(1)} Ha</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 text-slate-800">
                            <div className="bg-emerald-50 p-6 rounded-lg border-l-8 border-emerald-600 mb-8">
                                <h2 className="text-emerald-800 font-bold text-lg mb-2 uppercase">Composición del Fertilizante</h2>
                                <p className="font-bold text-xl text-slate-900 mb-2">{report.fertilization_plan.fertilizer_composition.name}</p>
                                <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                                    <div><span className="font-bold">Nitrógeno (N):</span> {report.fertilization_plan.fertilizer_composition.macro_n}</div>
                                    <div><span className="font-bold">Fósforo (P):</span> {report.fertilization_plan.fertilizer_composition.macro_p}</div>
                                    <div><span className="font-bold">Potasio (K):</span> {report.fertilization_plan.fertilizer_composition.macro_k}</div>
                                </div>
                                <p className="text-sm text-slate-600 italic border-t border-emerald-200 pt-2 mt-2">
                                    Microelementos: {report.fertilization_plan.fertilizer_composition.micro_elements}
                                </p>
                            </div>

                            <h2 className="bg-emerald-600 text-white font-bold py-2 px-4 uppercase text-sm mb-4">Plan de Fertilización</h2>

                            <div className="space-y-6">
                                {report.fertilization_plan.stages.map((stage, i) => (
                                    <div key={i} className="mb-6">
                                        <div className="flex items-center mb-2 bg-slate-100 p-2 border-l-4 border-emerald-500">
                                            <h3 className="font-bold text-slate-800 flex-grow">{stage.total_days_range}: {stage.stage_name}</h3>
                                        </div>
                                        <p className="text-sm text-slate-500 italic mb-3 pl-4">Objetivo: {stage.objective}</p>

                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="text-left text-slate-400 border-b border-slate-200">
                                                    <th className="pb-2 pl-4 w-24">Días</th>
                                                    <th className="pb-2">Actividad / Producto</th>
                                                    <th className="pb-2 w-32">Dosis</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stage.activities.map((act, j) => (
                                                    <tr key={j} className="border-b border-slate-50">
                                                        <td className="py-3 pl-4 font-bold text-emerald-700 align-top">{act.days_range}</td>
                                                        <td className="py-3 align-top pr-4">
                                                            <div className="font-bold text-slate-800">{act.product}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{act.action} - {act.notes}</div>
                                                        </td>
                                                        <td className="py-3 font-mono text-slate-700 align-top">{act.dosage}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="absolute bottom-0 w-full text-center pb-4 text-[10px] text-slate-400">
                            Generado por AI SoilCheck - Documento Global 2 de 2
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
