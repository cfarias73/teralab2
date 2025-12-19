
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

    // Normalize report structure for compatibility (old vs new schema)
    const healthClass = report.executive_summary?.overall_health || report.field_summary?.health_classification || 'good';
    const summaryText = report.final_integrated_summary || report.final_summary_text || report.executive_summary?.main_conclusion || '';
    const dominantSoil = report.executive_summary?.soil_type_dominant || report.field_summary?.dominant_soil || 'Franco';
    const problemsRanked = report.problems_ranked || report.field_problems_ranked || [];
    const actionPlan30 = report.action_plan?.immediate_30_days || report.action_plan?.['30_days'] || [];
    const actionPlan90 = report.action_plan?.short_term_90_days || report.action_plan?.['90_days'] || [];
    const actionPlan365 = report.action_plan?.annual_365_days || report.action_plan?.['365_days'] || [];
    const zonesData = report.zones_detailed || report.zones || [];
    const confidenceScore = report.executive_summary?.confidence_score || report.confidence_overall || 75;

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button onClick={() => navigate('/home')} className="p-2 -ml-2 rounded-full hover:bg-white/50"><ChevronLeft /></button>
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
                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${healthClass === 'excellent' ? 'bg-emerald-500' : healthClass === 'critical' || healthClass === 'poor' ? 'bg-red-500' : 'bg-amber-500'}`}>
                                Salud: {healthClass.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-sm text-primary-800 leading-relaxed font-light mb-4">
                            {summaryText}
                        </p>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                            <div className="bg-white/60 p-2 rounded-lg">
                                <span className="block text-xs text-gray-500">Confianza</span>
                                <span className="font-bold text-primary-900">{confidenceScore}%</span>
                            </div>
                            <div className="bg-white/60 p-2 rounded-lg">
                                <span className="block text-xs text-gray-500">Suelo Dom.</span>
                                <span className="font-bold text-primary-900 text-xs">{dominantSoil}</span>
                            </div>
                            <div className="bg-white/60 p-2 rounded-lg">
                                <span className="block text-xs text-gray-500">Problemas</span>
                                <span className="font-bold text-primary-900 text-xs">{problemsRanked.length} detectados</span>
                            </div>
                        </div>
                    </div>

                    {/* ===== NEW: 6 ANALYSIS PILLARS ===== */}

                    {/* 1. Physical & Structural Analysis */}
                    {report.physical_structural_analysis && (
                        <section className="glass-panel p-4 rounded-xl">
                            <h3 className="text-xs font-bold uppercase text-amber-700 mb-3 flex items-center">
                                <Layers size={14} className="mr-1" /> Análisis Físico y Estructural
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-amber-50 p-3 rounded-lg">
                                    <span className="font-bold text-amber-800 block">Compactación</span>
                                    <span className="text-amber-700">{report.physical_structural_analysis.compaction_diagnosis?.level || 'N/A'}</span>
                                    <p className="text-gray-500 mt-1 text-[10px]">{report.physical_structural_analysis.compaction_diagnosis?.impact_on_roots}</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-lg">
                                    <span className="font-bold text-amber-800 block">Macroporosidad</span>
                                    <span className="text-amber-700">{report.physical_structural_analysis.macroporosity?.rating || 'N/A'}</span>
                                    <p className="text-gray-500 mt-1 text-[10px]">{report.physical_structural_analysis.macroporosity?.structure_type}</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-lg">
                                    <span className="font-bold text-amber-800 block">Encostramiento</span>
                                    <span className="text-amber-700">{report.physical_structural_analysis.surface_stability?.crusting_present ? 'Sí' : 'No'}</span>
                                    <p className="text-gray-500 mt-1 text-[10px]">{report.physical_structural_analysis.surface_stability?.infiltration_impact}</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-lg">
                                    <span className="font-bold text-amber-800 block">Textura Validada</span>
                                    <span className="text-amber-700">{report.physical_structural_analysis.texture_validation?.visual_class || 'N/A'}</span>
                                    <p className="text-gray-500 mt-1 text-[10px]">vs SoilGrids: {report.physical_structural_analysis.texture_validation?.soilgrids_class}</p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 2. Water Dynamics */}
                    {report.water_dynamics_analysis && (
                        <section className="glass-panel p-4 rounded-xl">
                            <h3 className="text-xs font-bold uppercase text-blue-700 mb-3 flex items-center">
                                <AlertTriangle size={14} className="mr-1" /> Balance Hídrico
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <span className="font-bold text-blue-800 block">Reserva de Agua</span>
                                    <span className="text-blue-700">{report.water_dynamics_analysis.available_water_capacity?.rating || 'N/A'}</span>
                                    <p className="text-gray-500 mt-1 text-[10px]">{report.water_dynamics_analysis.available_water_capacity?.estimate_mm}</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <span className="font-bold text-blue-800 block">Riesgo Escorrentía</span>
                                    <span className="text-blue-700">{report.water_dynamics_analysis.infiltration_runoff_risk?.risk_level || 'N/A'}</span>
                                    <p className="text-gray-500 mt-1 text-[10px]">{report.water_dynamics_analysis.infiltration_runoff_risk?.texture_factor}</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <span className="font-bold text-blue-800 block">Déficit Humedad</span>
                                    <span className={`font-bold ${report.water_dynamics_analysis.moisture_deficit?.current_status === 'severe_stress' ? 'text-red-600' : 'text-blue-700'}`}>
                                        {report.water_dynamics_analysis.moisture_deficit?.current_status || 'N/A'}
                                    </span>
                                    <p className="text-gray-500 mt-1 text-[10px]">{report.water_dynamics_analysis.moisture_deficit?.irrigation_recommendation}</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <span className="font-bold text-blue-800 block">Drenaje</span>
                                    <span className="text-blue-700">{report.water_dynamics_analysis.drainage_assessment?.status || 'N/A'}</span>
                                    <p className="text-gray-500 mt-1 text-[10px]">{report.water_dynamics_analysis.drainage_assessment?.evidence}</p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 3. Chemical & Biological */}
                    {report.chemical_biological_analysis && (
                        <section className="glass-panel p-4 rounded-xl">
                            <h3 className="text-xs font-bold uppercase text-green-700 mb-3 flex items-center">
                                <Sprout size={14} className="mr-1" /> Potencial Químico y Biológico
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <span className="font-bold text-green-800 block">Materia Orgánica</span>
                                    <span className="text-green-700">{report.chemical_biological_analysis.organic_matter?.estimated_level || 'N/A'}</span>
                                    <p className="text-gray-500 mt-1 text-[10px]">{report.chemical_biological_analysis.organic_matter?.improvement_potential}</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <span className="font-bold text-green-800 block">Disponibilidad Nutrientes</span>
                                    <span className="text-green-700">pH: {report.chemical_biological_analysis.nutrient_availability?.ph_class || 'N/A'}</span>
                                    <p className="text-gray-500 mt-1 text-[10px]">{report.chemical_biological_analysis.nutrient_availability?.ph_effect_on_nutrients}</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg col-span-2">
                                    <span className="font-bold text-green-800 block">Actividad Biológica</span>
                                    <span className="text-green-700">{report.chemical_biological_analysis.biological_activity?.soil_health_rating || 'N/A'}</span>
                                    <p className="text-gray-500 mt-1 text-[10px]">
                                        Indicadores: {report.chemical_biological_analysis.biological_activity?.indicators_found?.join(', ') || 'No detectados'}
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 4. Agronomic Risks */}
                    {report.agronomic_risks && (
                        <section className="glass-panel p-4 rounded-xl border-l-4 border-red-400">
                            <h3 className="text-xs font-bold uppercase text-red-700 mb-3 flex items-center">
                                <AlertTriangle size={14} className="mr-1" /> Riesgos Agronómicos
                            </h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center bg-red-50 p-2 rounded">
                                    <span className="font-bold text-red-800">Erosión</span>
                                    <span className={`px-2 py-0.5 rounded text-white text-[10px] ${report.agronomic_risks.erosion_risk?.level === 'high' || report.agronomic_risks.erosion_risk?.level === 'severe' ? 'bg-red-500' : 'bg-amber-500'}`}>
                                        {report.agronomic_risks.erosion_risk?.level || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-red-50 p-2 rounded">
                                    <span className="font-bold text-red-800">Salinidad</span>
                                    <span className={`px-2 py-0.5 rounded text-white text-[10px] ${report.agronomic_risks.salinity_alert?.present ? 'bg-red-500' : 'bg-green-500'}`}>
                                        {report.agronomic_risks.salinity_alert?.severity || 'none'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-red-50 p-2 rounded">
                                    <span className="font-bold text-red-800">Lixiviación (pérdida N)</span>
                                    <span className={`px-2 py-0.5 rounded text-white text-[10px] ${report.agronomic_risks.leaching_susceptibility?.risk === 'high' ? 'bg-red-500' : 'bg-amber-500'}`}>
                                        {report.agronomic_risks.leaching_susceptibility?.risk || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 5. Strategic Crop Analysis */}
                    {report.strategic_crop_analysis && (
                        <section className="glass-panel p-4 rounded-xl">
                            <h3 className="text-xs font-bold uppercase text-purple-700 mb-3 flex items-center">
                                <TrendingUp size={14} className="mr-1" /> Análisis Estratégico ({report.strategic_crop_analysis.current_stage})
                            </h3>
                            <div className="space-y-2">
                                {report.strategic_crop_analysis.stage_specific_recommendations?.slice(0, 3).map((rec: any, i: number) => (
                                    <div key={i} className="bg-purple-50 p-3 rounded-lg text-xs">
                                        <span className="font-bold text-purple-800">{rec.category}</span>
                                        <p className="text-purple-700 mt-1">{rec.recommendation}</p>
                                        <p className="text-gray-500 text-[10px] mt-1">Timing: {rec.timing} | Beneficio: {rec.expected_benefit}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 6. Temporal Comparison - Only show when REAL NDVI data exists */}
                    {(() => {
                        // Check if we have valid NDVI data (not placeholders or error messages)
                        const ndviText = report.temporal_comparison?.ndvi_anomaly?.current_vs_historical?.toLowerCase() || '';
                        const hasNoData =
                            !report.temporal_comparison ||
                            !ndviText ||
                            ndviText.includes('n/a') ||
                            ndviText.includes('no disponible') ||
                            ndviText.includes('no hay datos') ||
                            ndviText.includes('sin datos') ||
                            ndviText.includes('no se puede') ||
                            ndviText.includes('no disponibles') ||
                            ndviText.includes('ausencia') ||
                            ndviText.includes('no detectado') ||
                            ndviText.includes('null') ||
                            ndviText.length < 5; // Too short to be real data

                        if (hasNoData) return null;

                        return (
                            <section className="glass-panel p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50">
                                <h3 className="text-xs font-bold uppercase text-indigo-700 mb-3 flex items-center">
                                    <Calendar size={14} className="mr-1" /> Análisis Temporal
                                </h3>
                                <div className="text-xs space-y-2">
                                    <div className="bg-white/60 p-3 rounded-lg">
                                        <span className="font-bold text-indigo-800 block">Anomalía NDVI</span>
                                        <span className="text-indigo-700">{report.temporal_comparison.ndvi_anomaly?.current_vs_historical}</span>
                                        <p className="text-gray-500 mt-1">{report.temporal_comparison.ndvi_anomaly?.interpretation}</p>
                                    </div>
                                    <div className="bg-white/60 p-3 rounded-lg">
                                        <span className="font-bold text-indigo-800 block">Evolución Estacional</span>
                                        <p className="text-indigo-700">{report.temporal_comparison.seasonal_profile_evolution}</p>
                                    </div>
                                </div>
                            </section>
                        );
                    })()}

                    {/* ===== END NEW SECTIONS ===== */}

                    {/* Ranked Problems */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-gray-500">Problemas Prioritarios</h3>
                        {problemsRanked.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No se detectaron problemas críticos.</p>
                        ) : problemsRanked.map((prob: any, i: number) => (
                            <div key={i} className="glass-panel p-4 rounded-xl border-l-4 border-red-400">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-gray-800">{prob.problem}</h4>
                                    <span className="text-xs font-bold text-red-600">Severidad: {prob.severity_score || prob.severity}</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">Ubicación: {prob.location}</p>
                                <p className="text-xs text-gray-500 italic">Causa: {prob.root_cause || prob.cause}</p>
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
                                    {actionPlan30.length === 0 ? (
                                        <li className="text-xs text-gray-400 italic">Sin acciones inmediatas requeridas.</li>
                                    ) : actionPlan30.map((item: any, i: number) => (
                                        <li key={i} className="text-xs text-gray-700 flex items-start">
                                            <span className="mr-2 text-emerald-500">•</span>
                                            <span>{item.action} <span className="text-gray-400">({item.expected_result || item.benefit})</span></span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* 90 Days */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                                <h4 className="font-bold text-blue-800 text-sm mb-2">Mediano Plazo (90 Días)</h4>
                                <ul className="space-y-2">
                                    {actionPlan90.length === 0 ? (
                                        <li className="text-xs text-gray-400 italic">Sin acciones a mediano plazo.</li>
                                    ) : actionPlan90.map((item: any, i: number) => (
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
                        {zonesData.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No hay detalles por zona disponibles.</p>
                        ) : zonesData.map((zoneData: any, idx: number) => {
                            const zoneDef = campaign.zones.find(z => z.id === zoneData.zone_id);
                            return (
                                <div key={idx} className="glass-panel p-4 rounded-xl border-l-4" style={{ borderLeftColor: zoneDef?.color || '#10b981' }}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-gray-800">{zoneData.zone_name || zoneDef?.name || `Zona ${idx + 1}`}</h4>
                                        <span className="text-[10px] text-gray-500">Salud: {zoneData.health_score || zoneData.variability_score || 'N/A'}%</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3">{zoneData.zone_summary || zoneData.summary_text}</p>

                                    <div className="space-y-1">
                                        {(zoneData.specific_recommendations || zoneData.recommendations_zone || []).slice(0, 2).map((rec: any, rI: number) => (
                                            <div key={rI} className="text-[10px] bg-white/50 px-2 py-1 rounded flex items-center">
                                                <TrendingUp size={10} className="mr-1 text-primary-600" />
                                                {typeof rec === 'string' ? rec : rec.action}
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
            {activeTab === 'fertilization' && report.fertilization_plan && (() => {
                // Normalize fertilization plan structure
                const fertPlan = report.fertilization_plan;
                const formulaName = fertPlan.base_formula?.npk_ratio || fertPlan.fertilizer_composition?.name || fertPlan.program_name || 'Fórmula NPK';
                const nitrogen = fertPlan.base_formula?.nitrogen_source || fertPlan.fertilizer_composition?.macro_n || 'N/A';
                const phosphorus = fertPlan.base_formula?.phosphorus_source || fertPlan.fertilizer_composition?.macro_p || 'N/A';
                const potassium = fertPlan.base_formula?.potassium_source || fertPlan.fertilizer_composition?.macro_k || 'N/A';
                const micronutrients = fertPlan.base_formula?.micronutrients || fertPlan.fertilizer_composition?.micro_elements || 'Microelementos';
                const stages = fertPlan.application_schedule || fertPlan.stages || [];
                const totalCost = fertPlan.total_cost_per_ha || fertPlan.financials?.estimated_cost_per_ha || 'N/A';
                const expectedROI = fertPlan.expected_roi || fertPlan.financials?.roi_estimated || 'N/A';

                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="glass-panel p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border-l-4 border-emerald-500">
                            <h3 className="text-xs font-bold text-emerald-800 uppercase mb-3">Fórmula Global Lote</h3>
                            <div className="flex items-start space-x-3 mb-3">
                                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 flex-shrink-0">
                                    <Sprout size={20} />
                                </div>
                                <p className="text-sm font-bold text-emerald-900 leading-tight">
                                    {formulaName}
                                </p>
                            </div>
                            <div className="space-y-1 text-xs bg-white/50 p-2 rounded-lg">
                                <div className="flex"><span className="font-bold text-emerald-700 w-8">N:</span><span className="text-emerald-800">{nitrogen}</span></div>
                                <div className="flex"><span className="font-bold text-emerald-700 w-8">P:</span><span className="text-emerald-800">{phosphorus}</span></div>
                                <div className="flex"><span className="font-bold text-emerald-700 w-8">K:</span><span className="text-emerald-800">{potassium}</span></div>
                            </div>
                            <p className="text-xs text-emerald-600 mt-2 italic">
                                + {micronutrients}
                            </p>
                            <div className="mt-3 pt-3 border-t border-emerald-200 flex justify-between text-xs">
                                <span className="text-gray-600">Costo estimado: <strong className="text-emerald-700">{totalCost}</strong></span>
                                <span className="text-gray-600">ROI: <strong className="text-emerald-700">{expectedROI}</strong></span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-primary-800/60 px-1">Calendario de Aplicación</h3>
                            {stages.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No hay calendario disponible.</p>
                            ) : stages.map((stage: any, idx: number) => (
                                <div key={idx} className="glass-panel rounded-xl overflow-hidden">
                                    <div className="bg-primary-50/50 p-3 border-b border-primary-100 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-primary-900 text-sm">{stage.phase || stage.stage_name}</h4>
                                            <p className="text-[10px] text-primary-600">{stage.days_from_start || stage.total_days_range}</p>
                                        </div>
                                        <CalendarCheck size={18} className="text-primary-400" />
                                    </div>
                                    <div className="p-3 space-y-3">
                                        {/* Handle both array of activities and single stage data */}
                                        {stage.activities ? stage.activities.map((act: any, aIdx: number) => (
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
                                        )) : (
                                            <div className="flex space-x-3 text-xs">
                                                <div className="flex-grow">
                                                    <p className="font-bold text-primary-800">{stage.product} <span className="font-normal text-gray-500">({stage.application_method})</span></p>
                                                    <div className="flex items-center space-x-2 mt-0.5">
                                                        <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded font-medium">{stage.dosage_per_ha}</span>
                                                    </div>
                                                    <p className="text-gray-500 mt-1">{stage.objective}</p>
                                                </div>
                                            </div>
                                        )}
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
                );
            })()}

            {/* PDF Templates (Hidden) - Keeping existing templates from Results.tsx but adapted for Field Report */}
            {/* Same templates as before, just rendering `report` data instead of `detailedReport` */}
            <div id="pdf-field-report" style={{ display: 'none', width: '210mm', minHeight: '297mm', background: 'white', fontFamily: 'Inter, sans-serif' }}>
                <div className="p-8 text-slate-800">
                    <div className="flex justify-between items-center border-b-2 border-primary-600 pb-4 mb-6">
                        <div className="flex items-center space-x-3">
                            <img src="/logo.png" alt="teralab.app" className="w-10 h-10 object-contain" />
                            <div>
                                <h1 className="text-3xl font-bold text-primary-800">teralab.app</h1>
                                <p className="text-sm text-slate-500">Informe Global de Campo</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-slate-800">{new Date(campaign.last_updated).toISOString().split('T')[0]}</p>
                            <p className="text-xs text-slate-500">LOTE: {campaign.parcel.name}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg mb-8">
                        <h2 className="text-lg font-bold text-primary-800 mb-2">Diagnóstico Ejecutivo</h2>
                        <p className="text-sm leading-relaxed text-justify">{summaryText}</p>
                        <div className="mt-4 flex space-x-4">
                            <span className="px-3 py-1 bg-white border rounded text-xs font-bold">Salud: {healthClass}</span>
                            <span className="px-3 py-1 bg-white border rounded text-xs font-bold">Suelo: {dominantSoil}</span>
                        </div>
                    </div>

                    <h2 className="font-bold text-lg mb-4 border-b pb-2">Análisis por Zonas</h2>
                    <div className="space-y-4 mb-8">
                        {zonesData.map((z: any, i: number) => (
                            <div key={i} className="border p-4 rounded bg-white">
                                <h3 className="font-bold text-slate-700 text-sm">Zona {z.zone_name || campaign.zones.find(zone => zone.id === z.zone_id)?.name || `${i + 1}`}</h3>
                                <p className="text-xs text-slate-500 mt-1">{z.zone_summary || z.summary_text}</p>
                                <div className="mt-2 text-xs">
                                    <strong>Recomendación:</strong> {(z.specific_recommendations || z.recommendations_zone)?.[0]?.action || (z.specific_recommendations || z.recommendations_zone)?.[0] || 'Sin recomendaciones'}
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
                            {problemsRanked.map((p: any, i: number) => (
                                <tr key={i} className="border-b"><td className="p-2">{p.problem}</td><td className="p-2">{p.location}</td><td className="p-2">{p.severity_score || p.severity}/100</td></tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-12 pt-4 border-t border-slate-200 text-center">
                        <p className="text-xs text-slate-400">Generado por teralab.app. Documento Global 1 de 2.</p>
                    </div>
                </div>
            </div>

            <div id="pdf-field-plan" style={{ display: 'none', width: '210mm', minHeight: '297mm', background: 'white', fontFamily: 'Inter, sans-serif' }}>
                {report.fertilization_plan && (() => {
                    const fertPlan = report.fertilization_plan;
                    const formulaName = fertPlan.base_formula?.npk_ratio || fertPlan.fertilizer_composition?.name || fertPlan.program_name || 'Fórmula NPK';
                    const nitrogen = fertPlan.base_formula?.nitrogen_source || fertPlan.fertilizer_composition?.macro_n || 'N/A';
                    const phosphorus = fertPlan.base_formula?.phosphorus_source || fertPlan.fertilizer_composition?.macro_p || 'N/A';
                    const potassium = fertPlan.base_formula?.potassium_source || fertPlan.fertilizer_composition?.macro_k || 'N/A';
                    const micronutrients = fertPlan.base_formula?.micronutrients || fertPlan.fertilizer_composition?.micro_elements || 'Microelementos';
                    const stages = fertPlan.application_schedule || fertPlan.stages || [];

                    return (
                        <div className="relative h-full">
                            <div className="bg-emerald-700 text-white p-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                        <img src="/logo.png" alt="teralab.app" className="w-10 h-10 object-contain bg-white/20 rounded p-1" />
                                        <div>
                                            <h1 className="text-2xl font-bold uppercase tracking-wide">Programa de Fertirriego</h1>
                                            <p className="text-emerald-200 mt-1 text-lg">{campaign.parcel.crop} | Etapa Productiva</p>
                                        </div>
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
                                    <p className="font-bold text-xl text-slate-900 mb-2">{formulaName}</p>
                                    <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                                        <div><span className="font-bold">Nitrógeno (N):</span> {nitrogen}</div>
                                        <div><span className="font-bold">Fósforo (P):</span> {phosphorus}</div>
                                        <div><span className="font-bold">Potasio (K):</span> {potassium}</div>
                                    </div>
                                    <p className="text-sm text-slate-600 italic border-t border-emerald-200 pt-2 mt-2">
                                        Microelementos: {micronutrients}
                                    </p>
                                </div>

                                <h2 className="bg-emerald-600 text-white font-bold py-2 px-4 uppercase text-sm mb-4">Plan de Fertilización</h2>

                                <div className="space-y-6">
                                    {stages.map((stage: any, i: number) => (
                                        <div key={i} className="mb-6">
                                            <div className="flex items-center mb-2 bg-slate-100 p-2 border-l-4 border-emerald-500">
                                                <h3 className="font-bold text-slate-800 flex-grow">{stage.days_from_start || stage.total_days_range}: {stage.phase || stage.stage_name}</h3>
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
                                                    {stage.activities ? stage.activities.map((act: any, j: number) => (
                                                        <tr key={j} className="border-b border-slate-50">
                                                            <td className="py-3 pl-4 font-bold text-emerald-700 align-top">{act.days_range}</td>
                                                            <td className="py-3 align-top pr-4">
                                                                <div className="font-bold text-slate-800">{act.product}</div>
                                                                <div className="text-xs text-slate-500 mt-0.5">{act.action} - {act.notes}</div>
                                                            </td>
                                                            <td className="py-3 font-mono text-slate-700 align-top">{act.dosage}</td>
                                                        </tr>
                                                    )) : (
                                                        <tr className="border-b border-slate-50">
                                                            <td className="py-3 pl-4 font-bold text-emerald-700 align-top">{stage.days_from_start}</td>
                                                            <td className="py-3 align-top pr-4">
                                                                <div className="font-bold text-slate-800">{stage.product}</div>
                                                                <div className="text-xs text-slate-500 mt-0.5">{stage.application_method}</div>
                                                            </td>
                                                            <td className="py-3 font-mono text-slate-700 align-top">{stage.dosage_per_ha}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="absolute bottom-0 w-full text-center pb-4 text-[10px] text-slate-400">
                                Generado por teralab.app - Documento Global 2 de 2
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};
