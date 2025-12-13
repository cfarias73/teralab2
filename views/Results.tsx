
import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AnalysisResult, DetailedReport, FertilizationStage, FertilizationActivity } from '../types';
import { CheckCircle, AlertTriangle, Droplet, Layers, AlertOctagon, Activity, Loader2, Key, Leaf, Download, Globe, ChevronLeft, Sprout, DollarSign, CalendarCheck, FileText } from 'lucide-react';
import { generateDetailedReport } from '../services/geminiService';

export const Results: React.FC = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const result = state?.result as AnalysisResult;

    const [detailedReport, setDetailedReport] = useState<DetailedReport | null>(null);
    const [reportLoading, setReportLoading] = useState<boolean>(false);
    const [reportError, setReportError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Tab State: 'analysis' | 'plan'
    const [activeTab, setActiveTab] = useState<'analysis' | 'plan'>('analysis');

    const fetchReport = async () => {
        if (!result) return;
        setReportLoading(true);
        setReportError(null);

        const win = window as any;
        if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await win.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
            if (!hasKey) {
                setReportLoading(false);
                return;
            }
        } else {
            setApiKeySelected(true);
        }

        try {
            const reportJsonStr = await generateDetailedReport(result);
            let reportData;
            try {
                reportData = JSON.parse(reportJsonStr);
            } catch (e) {
                console.error("Failed to parse detailed report JSON", e);
                reportData = null;
            }
            setDetailedReport(reportData);
        } catch (err: any) {
            console.error("Error generating detailed report:", err);
            let errorMessage = "No se pudo generar el informe detallado.";
            if (err.message && (err.message.includes("500") || err.message.includes("403"))) {
                errorMessage = "Error de API. Verifica tu clave.";
                setApiKeySelected(false);
            }
            setReportError(errorMessage);
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [result]);

    const handleSelectApiKey = async () => {
        const win = window as any;
        if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
            await win.aistudio.openSelectKey();
            setApiKeySelected(true);
            fetchReport();
        } else {
            alert("Configuración de API no disponible.");
        }
    };

    const handleDownloadPDF = (type: 'analysis' | 'plan') => {
        if (!detailedReport) return;
        setIsGeneratingPdf(true);

        const elementId = type === 'analysis' ? 'pdf-template-analysis' : 'pdf-template-plan';
        const element = document.getElementById(elementId);

        if (!element) {
            setIsGeneratingPdf(false);
            return;
        }

        // Show template temporarily
        element.style.display = 'block';

        const filename = type === 'analysis'
            ? `Analisis_Suelo_${detailedReport.parcel_info.parcel_name}.pdf`
            : `Plan_Fertilizacion_${detailedReport.parcel_info.parcel_name}.pdf`;

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

    if (!result) return <Navigate to="/" />;

    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-red-50/80 border-red-200 text-red-800';
            case 'medium': return 'bg-amber-50/80 border-amber-200 text-amber-800';
            case 'low': return 'bg-primary-50/80 border-primary-200 text-primary-800';
            default: return 'bg-gray-50/80 border-gray-200 text-gray-800';
        }
    };

    const ndviValue = result.satellite_indicators.ndvi;
    const ndviAnomaly = result.satellite_indicators.ndvi_anomaly;

    const getNdviColor = (ndvi: number | null) => {
        if (ndvi === null) return 'bg-gray-300';
        if (ndvi < 0.2) return 'bg-red-500';
        if (ndvi < 0.4) return 'bg-orange-400';
        if (ndvi < 0.6) return 'bg-yellow-400';
        if (ndvi < 0.8) return 'bg-primary-500';
        return 'bg-primary-700';
    };

    return (
        <div className="p-4 space-y-6 pb-24">

            {/* Header Summary Card - Glass */}
            <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-primary-500 relative">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/50 text-primary-800">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleSelectApiKey}
                            className="p-2 rounded-full bg-white/50 hover:bg-white text-primary-600 transition-colors"
                            title="Configurar API Key"
                        >
                            <Key size={18} />
                        </button>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-primary-900 mb-2">
                    {activeTab === 'analysis' ? 'Resultados del Suelo' : 'Plan de Fertilización'}
                </h1>
                <p className="text-primary-800 leading-relaxed font-light text-sm">
                    {activeTab === 'analysis' ? result.summary_text : `Programa para ${result.original_input.crop} optimizado por IA.`}
                </p>
            </div>

            {/* Tabs */}
            <div className="bg-gray-200/50 p-1 rounded-xl flex space-x-1">
                <button
                    onClick={() => setActiveTab('analysis')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all ${activeTab === 'analysis' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
                >
                    <Activity size={16} />
                    <span>Diagnóstico</span>
                </button>
                <button
                    onClick={() => setActiveTab('plan')}
                    disabled={!detailedReport?.fertilization_plan}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all ${activeTab === 'plan' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:bg-white/50 disabled:opacity-50'}`}
                >
                    <Sprout size={16} />
                    <span>Fertilización</span>
                </button>
            </div>

            {/* --- TAB CONTENT: ANALYSIS --- */}
            {activeTab === 'analysis' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    {/* Key Indicators Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform">
                            <div className="flex items-center space-x-2 mb-3 text-primary-700">
                                <div className="p-2 bg-primary-100 rounded-lg"><Layers size={20} /></div>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-primary-500 uppercase tracking-wider">Textura (IA)</span>
                                <p className="text-lg font-bold capitalize text-primary-900 leading-tight mt-1">{result.texture.class.replace('_', ' ')}</p>
                            </div>
                        </div>

                        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform">
                            <div className="flex items-center space-x-2 mb-3 text-blue-600">
                                <div className="p-2 bg-blue-50 rounded-lg"><Droplet size={20} /></div>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Humedad</span>
                                <p className="text-lg font-bold capitalize text-primary-900 leading-tight mt-1">
                                    {result.moisture_level.status === 'wet' ? 'Mojado' : result.moisture_level.status === 'moist' ? 'Húmedo' : 'Seco'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Risks / Alerts */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary-800/60 px-1">Riesgos</h3>
                        {result.compaction.level !== 'low' && (
                            <div className={`p-4 rounded-xl border flex items-start space-x-3 backdrop-blur-sm ${getSeverityStyle(result.compaction.level)}`}>
                                <AlertOctagon className="mt-0.5 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-bold text-sm">Compactación: {result.compaction.level.toUpperCase()}</p>
                                    <p className="text-xs opacity-90 mt-1">{result.compaction.evidence}</p>
                                </div>
                            </div>
                        )}

                        {result.salinity.present && (
                            <div className={`p-4 rounded-xl border flex items-start space-x-3 backdrop-blur-sm ${getSeverityStyle(result.salinity.severity)}`}>
                                <AlertTriangle className="mt-0.5 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-bold text-sm">Salinidad: {result.salinity.severity.toUpperCase()}</p>
                                    <p className="text-xs opacity-90 mt-1">{result.salinity.evidence}</p>
                                </div>
                            </div>
                        )}

                        {result.compaction.level === 'low' && !result.salinity.present && !result.erosion_signs.present && (
                            <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 text-primary-800">
                                <CheckCircle size={20} className="text-primary-600" />
                                <span className="font-medium text-sm">Sin riesgos críticos detectados.</span>
                            </div>
                        )}
                    </div>

                    {/* Satellite Indicators */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary-800/60 px-1">Satélite</h3>
                        <div className="glass-panel p-5 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-primary-700">
                                    <Leaf size={18} />
                                    <span className="font-bold text-sm">Vigor (NDVI)</span>
                                </div>
                                {ndviValue !== null && (
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${ndviAnomaly && ndviAnomaly < 0 ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700'}`}>
                                        {ndviValue.toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {ndviValue !== null ? (
                                <div>
                                    <div className="w-full bg-gray-200/50 rounded-full h-3 backdrop-blur-sm overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${getNdviColor(ndviValue)}`}
                                            style={{ width: `${Math.max(0, Math.min(1, ndviValue)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px] text-primary-500 font-medium uppercase">
                                        <span>Bajo</span>
                                        <span>Óptimo</span>
                                        <span>Alto</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Datos no disponibles.</p>
                            )}
                        </div>
                    </div>

                    {/* Download Section Analysis */}
                    <div className="mt-8 pt-4 border-t border-primary-200/50">
                        {!detailedReport ? (
                            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                                {reportLoading ? (
                                    <>
                                        <Loader2 size={32} className="text-primary-500 animate-spin" />
                                        <p className="text-sm text-primary-700 font-medium">Generando reportes con IA...</p>
                                    </>
                                ) : apiKeySelected === false ? (
                                    <button onClick={handleSelectApiKey} className="text-xs bg-primary-600 text-white px-4 py-2 rounded-lg">Configurar API</button>
                                ) : (
                                    <p className="text-sm text-red-500">{reportError || "Esperando..."}</p>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => handleDownloadPDF('analysis')}
                                disabled={isGeneratingPdf}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95"
                            >
                                {isGeneratingPdf ? <Loader2 className="animate-spin mr-2" size={18} /> : <FileText size={18} className="mr-2" />}
                                {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Análisis de Suelo'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* --- TAB CONTENT: FERTILIZATION PLAN --- */}
            {activeTab === 'plan' && detailedReport?.fertilization_plan && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">

                    {/* Composition Card */}
                    <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border-l-4 border-emerald-500">
                        <h3 className="text-xs font-bold text-emerald-800 uppercase mb-2">Fórmula Recomendada</h3>
                        <div className="flex items-start space-x-3">
                            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                                <Sprout size={24} />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-emerald-900 leading-tight">
                                    {detailedReport.fertilization_plan.fertilizer_composition.name}
                                </p>
                                <div className="flex space-x-3 mt-2 text-xs font-mono text-emerald-700 bg-white/50 px-2 py-1 rounded inline-block">
                                    <span>N: {detailedReport.fertilization_plan.fertilizer_composition.macro_n}</span>
                                    <span>P: {detailedReport.fertilization_plan.fertilizer_composition.macro_p}</span>
                                    <span>K: {detailedReport.fertilization_plan.fertilizer_composition.macro_k}</span>
                                </div>
                                <p className="text-xs text-emerald-600 mt-1 italic">
                                    + {detailedReport.fertilization_plan.fertilizer_composition.micro_elements}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Stages */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary-800/60 px-1">Calendario de Aplicación</h3>
                        {detailedReport.fertilization_plan.stages.map((stage, idx) => (
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

                    {/* Download Plan */}
                    <div className="pt-4 border-t border-primary-200/50">
                        <button
                            onClick={() => handleDownloadPDF('plan')}
                            disabled={isGeneratingPdf}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95"
                        >
                            {isGeneratingPdf ? <Loader2 className="animate-spin mr-2" size={18} /> : <FileText size={18} className="mr-2" />}
                            {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Plan de Fertilización'}
                        </button>
                    </div>
                </div>
            )}

            {/* --- HIDDEN PDF TEMPLATES --- */}

            {/* 1. ANALYSIS PDF */}
            <div id="pdf-template-analysis" style={{ display: 'none', width: '210mm', minHeight: '297mm', background: 'white', fontFamily: 'Inter, sans-serif' }}>
                {detailedReport && (
                    <div className="p-8 text-slate-800">
                        <div className="flex justify-between items-center border-b-2 border-primary-600 pb-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-primary-800">AI SoilCheck</h1>
                                <p className="text-sm text-slate-500">Informe de Análisis de Suelo</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-800">{detailedReport.parcel_info.date.split('T')[0]}</p>
                                <p className="text-xs text-slate-500">REF: {detailedReport.parcel_info.parcel_name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h2 className="text-sm font-bold text-slate-500 uppercase mb-2">Diagnóstico Ejecutivo</h2>
                                <p className="text-sm leading-relaxed text-justify">{detailedReport.executive_summary}</p>
                            </div>
                            <div>
                                <h3 className="text-primary-700 font-bold border-b border-primary-200 pb-1 mb-3">Física del Suelo</h3>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {detailedReport.physical_properties.map((prop: any, i: number) => (
                                            <tr key={i} className="border-b border-slate-100">
                                                <td className="py-2 text-slate-600">{prop.parameter}</td>
                                                <td className="py-2 font-bold text-right">{prop.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <h3 className="text-primary-700 font-bold border-b border-primary-200 pb-1 mb-3">Química Estimada</h3>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {detailedReport.chemical_properties.map((prop: any, i: number) => (
                                            <tr key={i} className="border-b border-slate-100">
                                                <td className="py-2 text-slate-600">{prop.parameter}</td>
                                                <td className="py-2 font-bold text-right">{prop.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recomendaciones de Manejo */}
                        <div className="mb-8">
                            <h3 className="text-primary-700 font-bold border-b border-primary-200 pb-1 mb-3">Recomendaciones de Manejo</h3>
                            <div className="space-y-3">
                                {detailedReport.recommendations?.map((rec: any, i: number) => (
                                    <div key={i} className="flex items-start space-x-2 border-b border-slate-100 pb-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                            {rec.priority === 'high' ? 'ALTA' : rec.priority === 'medium' ? 'MEDIA' : 'BAJA'}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{rec.action}</p>
                                            <p className="text-xs text-slate-500">{rec.details || rec.reason}</p>
                                        </div>
                                    </div>
                                )) || <p className="text-sm text-slate-500 italic">Sin recomendaciones específicas.</p>}
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <h4 className="font-bold text-amber-800 text-sm mb-1">⚠️ Aviso Importante</h4>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Este informe es una estimación generada por inteligencia artificial basada en análisis visual de imágenes y datos climáticos.
                                Los resultados son indicativos y <strong>no reemplazan un análisis de laboratorio profesional</strong>.
                                Se recomienda validar las conclusiones con pruebas de suelo certificadas antes de tomar decisiones agronómicas mayores.
                            </p>
                        </div>

                        <div className="mt-12 pt-4 border-t border-slate-200 text-center">
                            <p className="text-xs text-slate-400">Generado por AI SoilCheck. Documento 1 de 2.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. FERTILIZATION PLAN PDF */}
            <div id="pdf-template-plan" style={{ display: 'none', width: '210mm', minHeight: '297mm', background: 'white', fontFamily: 'Inter, sans-serif' }}>
                {detailedReport?.fertilization_plan && (
                    <div className="relative h-full">
                        {/* Green Header */}
                        <div className="bg-emerald-700 text-white p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold uppercase tracking-wide">Programa de Fertirriego</h1>
                                    <p className="text-emerald-200 mt-1 text-lg">{detailedReport.parcel_info.crop} | Etapa Productiva</p>
                                </div>
                                <div className="text-right">
                                    <div className="bg-white/20 p-2 rounded backdrop-blur-md">
                                        <p className="font-mono font-bold text-xl">{detailedReport.parcel_info.parcel_name}</p>
                                        <p className="text-xs text-emerald-100">1 Ha (Base)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 text-slate-800">
                            {/* Composition */}
                            <div className="bg-emerald-50 p-6 rounded-lg border-l-8 border-emerald-600 mb-8">
                                <h2 className="text-emerald-800 font-bold text-lg mb-2 uppercase">Composición del Fertilizante</h2>
                                <p className="font-bold text-xl text-slate-900 mb-2">{detailedReport.fertilization_plan.fertilizer_composition.name}</p>
                                <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                                    <div><span className="font-bold">Nitrógeno (N):</span> {detailedReport.fertilization_plan.fertilizer_composition.macro_n}</div>
                                    <div><span className="font-bold">Fósforo (P):</span> {detailedReport.fertilization_plan.fertilizer_composition.macro_p}</div>
                                    <div><span className="font-bold">Potasio (K):</span> {detailedReport.fertilization_plan.fertilizer_composition.macro_k}</div>
                                </div>
                                <p className="text-sm text-slate-600 italic border-t border-emerald-200 pt-2 mt-2">
                                    Microelementos: {detailedReport.fertilization_plan.fertilizer_composition.micro_elements}
                                </p>
                            </div>

                            {/* Plan Table */}
                            <h2 className="bg-emerald-600 text-white font-bold py-2 px-4 uppercase text-sm mb-4">Plan de Fertilización</h2>

                            <div className="space-y-6">
                                {detailedReport.fertilization_plan.stages.map((stage, i) => (
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
                            Generado por AI SoilCheck - Documento 2 de 2
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};
