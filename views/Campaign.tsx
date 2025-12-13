
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FieldCampaign, SamplingPoint, AnalysisResult } from '../types';
import { analyzeSoil, generateFieldReport } from '../services/geminiService';
import { saveCampaign, saveAnalysis, getCampaignById, getTotalAnalysesMade, recordSimulatedPayment, decrementFreeAnalysisLimit } from '../services/dataService';
import { Map, Marker } from 'pigeon-maps';
import { Camera, CheckCircle, Navigation, ChevronLeft, Loader2, FileText, BrainCircuit, ArrowRight, Save, AlertTriangle, X, CreditCard, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const satelliteProvider = (x: number, y: number, z: number) => {
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
};

const PAYMENT_AMOUNT = 6.99; // USD

export const Campaign: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, refreshUserProfile } = useAuth(); // Get userProfile and refresh function
  const [campaign, setCampaign] = useState<FieldCampaign | null>(null);
  const [activePoint, setActivePoint] = useState<SamplingPoint | null>(null);
  
  // Batch Flow State: Store images in memory until final analysis
  const [batchImages, setBatchImages] = useState<Record<string, {surface: File, profile: File}>>({});
  
  const [surfaceImg, setSurfaceImg] = useState<File | null>(null);
  const [profileImg, setProfileImg] = useState<File | null>(null);
  
  // Processing State
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');

  // Payment Wall State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Free Analyses Tracking State
  const [userAnalysesCount, setUserAnalysesCount] = useState<number>(0);
  const [displayFreeAnalysesRemaining, setDisplayFreeAnalysesRemaining] = useState<number | null>(null);


  useEffect(() => {
    const fetchCampaign = async () => {
        if (id) {
            const data = await getCampaignById(id);
            setCampaign(data);
        }
    };
    fetchCampaign();
  }, [id]);

  useEffect(() => {
    if (activePoint && batchImages[activePoint.id]) {
        setSurfaceImg(batchImages[activePoint.id].surface);
        setProfileImg(batchImages[activePoint.id].profile);
    } else {
        setSurfaceImg(null);
        setProfileImg(null);
    }
  }, [activePoint]);

  // Fetch total analyses made by the user
  useEffect(() => {
      const fetchAnalysesCount = async () => {
          if (user?.id) {
              const count = await getTotalAnalysesMade(user.id);
              setUserAnalysesCount(count);
          } else {
              setUserAnalysesCount(0);
          }
      };
      fetchAnalysesCount();
  }, [user?.id, userProfile]); // Re-run when user changes or profile is refreshed

  // Calculate and display remaining free analyses
  useEffect(() => {
      if (userProfile && userProfile.free_analyses_limit !== undefined) {
          const remaining = Math.max(0, userProfile.free_analyses_limit - userAnalysesCount);
          setDisplayFreeAnalysesRemaining(remaining);
      } else {
          setDisplayFreeAnalysesRemaining(null);
      }
  }, [userProfile, userAnalysesCount]);


  const handlePointClick = (point: SamplingPoint) => {
    setActivePoint(point);
  };

  const handleSaveSample = () => {
      if (!campaign || !activePoint || !surfaceImg || !profileImg) return;

      // 1. Save images to memory
      setBatchImages(prev => ({
          ...prev,
          [activePoint.id]: { surface: surfaceImg, profile: profileImg }
      }));

      // 2. Mark point as 'sampled' locally (visual feedback)
      const updatedPoints = campaign.points.map(p => 
        p.id === activePoint.id ? { ...p, status: 'sampled' as const } : p
      );
      
      const updatedCampaign = { ...campaign, points: updatedPoints };
      setCampaign(updatedCampaign);
      
      // We don't save to DB yet to avoid too many writes, but in a real app we might
      // For this MVP, we keep it in memory/local state until batch processing.

      // 3. Move to next pending point or close
      const nextPoint = updatedPoints.find(p => p.status === 'pending');
      if (nextPoint) {
          setActivePoint(nextPoint);
      } else {
          setActivePoint(null); // All done
      }
  };

  // --- Core Analysis Logic (Moved to a separate function) ---
  const _performAnalysis = async (): Promise<boolean> => { // Now returns boolean
      if (!campaign || !user) {
        setIsProcessingBatch(false);
        return false;
      }
      setIsProcessingBatch(true);
      setBatchProgress(0);

      const sampledPoints = campaign.points.filter(p => p.status === 'sampled');
      const results: AnalysisResult[] = [];

      try {
          // 1. Analyze each point sequentially and SAVE to DB
          for (let i = 0; i < sampledPoints.length; i++) {
              const point = sampledPoints[i];
              const images = batchImages[point.id];
              
              setProcessingStatus(`Analizando punto ${i + 1} de ${sampledPoints.length}...`);
              
              if (!images) {
                  console.warn(`No images found for point ${point.label}, skipping analysis.`);
                  continue;
              }

              // Call Gemini
              const result = await analyzeSoil(
                  images.surface, images.profile, point.lat, point.lon, 5, 
                  campaign.parcel.crop, campaign.parcel.name, `Punto ${point.label}`
              );

              result.id = `an-${Date.now()}-${i}`;
              result.sampling_point_id = point.id;
              
              // SAVE ANALYSIS TO SUPABASE
              await saveAnalysis(result, campaign.id);
              
              results.push(result);

              // Update progress
              setBatchProgress(Math.round(((i + 1) / sampledPoints.length) * 0.8 * 100));
          }

          // 2. Generate Global Field Report
          setProcessingStatus("Generando reporte global del lote...");
          const globalReport = await generateFieldReport(campaign, results);
          setBatchProgress(90);

          // 3. Final Save of Campaign (Updated status and report)
          const finalPoints = campaign.points.map(p => {
              const res = results.find(r => r.sampling_point_id === p.id);
              return res ? { ...p, analysis_result_id: res.id } : p;
          });

          const finalCampaign: FieldCampaign = {
              ...campaign,
              points: finalPoints,
              status: 'completed',
              global_analysis: globalReport,
              last_updated: new Date().toISOString()
          };

          await saveCampaign(finalCampaign);
          setBatchProgress(100);

          // 4. Redirect
          navigate(`/field-results/${campaign.id}`);
          return true; // Analysis successful

      } catch (error: any) {
          console.error("Batch processing failed", error);
          alert("Hubo un error en el procesamiento: " + error.message);
          return false; // Analysis failed
      } finally {
          setIsProcessingBatch(false);
      }
  };


  const handleInitiateBatchAnalysis = async () => {
    if (!user) {
        alert("Debes iniciar sesión para realizar análisis.");
        navigate('/auth');
        return;
    }
    if (!userProfile) {
        alert("Cargando perfil de usuario, por favor espera.");
        return;
    }

    // Use already fetched userAnalysesCount
    if (userAnalysesCount < userProfile.free_analyses_limit) {
        // This is a free analysis, proceed and then decrement
        const success = await _performAnalysis();
        if (success && user.id) {
            await decrementFreeAnalysisLimit(user.id);
            await refreshUserProfile(); // Refresh the profile in AuthContext
            // Optimistically update local state for immediate UI feedback
            setUserAnalysesCount(prev => prev + 1);
        }
    } else {
        // Subsequent analyses require payment
        setShowPaymentModal(true);
    }
  };

  const handleSimulatedPayment = async () => {
    if (!user) return; 
    setPaymentProcessing(true);
    setPaymentError(null);

    try {
        // Simulate Stripe processing time
        await new Promise(resolve => setTimeout(resolve, 2000)); 

        await recordSimulatedPayment(user.id, PAYMENT_AMOUNT, 'USD');
        
        setShowPaymentModal(false);
        setPaymentProcessing(false);
        await _performAnalysis(); // Proceed with the analysis after successful payment
        
    } catch (error: any) {
        console.error("Simulated payment failed:", error);
        setPaymentError(error.message || "Error al procesar el pago. Intenta de nuevo.");
        setPaymentProcessing(false);
    }
  };

  if (!campaign) return <div className="p-8 text-center flex flex-col items-center"><Loader2 className="animate-spin mb-2"/>Cargando Campaña...</div>;

  const sampledCount = campaign.points.filter(p => p.status === 'sampled').length;
  const totalCount = campaign.points.length;
  const progressPct = Math.round((sampledCount / totalCount) * 100);
  const isReadyToAnalyze = progressPct === 100;

  return (
    <div className="h-full flex flex-col bg-gray-100 relative">
      {/* Header */}
      <div className="glass-panel p-4 z-10 flex justify-between items-center">
        <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronLeft size={20} />
        </button>
        <div className="text-center">
            <h1 className="font-bold text-primary-900">{campaign.parcel.name}</h1>
            <div className="flex items-center justify-center space-x-2 text-xs text-primary-600">
                <span className={`w-2 h-2 rounded-full ${isReadyToAnalyze ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span>{sampledCount}/{totalCount} Muestras</span>
            </div>
        </div>
        <div>
            {campaign.status === 'completed' && (
                <button onClick={() => navigate(`/field-results/${campaign.id}`)} className="text-emerald-600">
                    <FileText size={24} />
                </button>
            )}
        </div>
      </div>

      {/* Map Context */}
      <div className="h-1/3 w-full relative">
        <Map center={campaign.parcel.centroid} zoom={14} provider={satelliteProvider}>
            {campaign.points.map(p => (
                <Marker 
                    key={p.id} 
                    anchor={[p.lat, p.lon]} 
                    color={p.status === 'sampled' ? '#10b981' : '#f59e0b'} 
                    width={30}
                    onClick={() => handlePointClick(p)}
                />
            ))}
        </Map>
      </div>

      {/* Action Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3 pb-24">
        
        {/* Main "Process" Button if Ready */}
        {isReadyToAnalyze && !activePoint && campaign.status !== 'completed' && (
             <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 mb-4 animate-in zoom-in-95">
                 <div className="flex flex-col items-center text-center space-y-4">
                     <div className="bg-emerald-100 p-4 rounded-full">
                         <BrainCircuit size={32} className="text-emerald-600" />
                     </div>
                     <div>
                         <h2 className="text-lg font-bold text-emerald-900">Muestreo Completado</h2>
                         <p className="text-sm text-emerald-700">Todas las fotos han sido capturadas. Inicia el análisis global con IA.</p>
                     </div>
                     <button 
                        onClick={handleInitiateBatchAnalysis}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
                     >
                        <span>Analizar Lote Completo</span>
                        <ArrowRight size={20} />
                     </button>
                     {displayFreeAnalysesRemaining !== null && displayFreeAnalysesRemaining > 0 && (
                        <p className="text-xs text-primary-600 mt-2">
                          Te quedan <span className="font-bold">{displayFreeAnalysesRemaining}</span> análisis gratuitos.
                        </p>
                      )}
                 </div>
             </div>
        )}

        {activePoint ? (
            <div className="glass-panel p-6 rounded-2xl animate-in slide-in-from-bottom-10 transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-primary-900">Punto {activePoint.label}</h2>
                    <button onClick={() => setActivePoint(null)} className="text-gray-400 hover:text-red-500">
                        <span className="sr-only">Cerrar</span>
                        <ChevronLeft size={24} className="-rotate-90"/>
                    </button>
                </div>

                <div className="flex items-center space-x-2 mb-6 bg-blue-50 p-3 rounded-lg text-blue-700 text-xs">
                    <Navigation size={16} />
                    <span>Captura las imágenes para este punto. Se guardarán temporalmente.</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6" key={activePoint.id}>
                    <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${surfaceImg ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setSurfaceImg(e.target.files[0])} />
                        {surfaceImg ? <img src={URL.createObjectURL(surfaceImg)} className="w-full h-full object-cover rounded-xl"/> : <Camera className="text-gray-400 mb-2"/>}
                        <span className="text-[10px] font-bold text-gray-500">{surfaceImg ? 'Capturada' : 'Superficie'}</span>
                    </label>
                    <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${profileImg ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setProfileImg(e.target.files[0])} />
                        {profileImg ? <img src={URL.createObjectURL(profileImg)} className="w-full h-full object-cover rounded-xl"/> : <Camera className="text-gray-400 mb-2"/>}
                        <span className="text-[10px] font-bold text-gray-500">{profileImg ? 'Capturada' : 'Perfil (Hoyo)'}</span>
                    </label>
                </div>

                <button 
                    disabled={!surfaceImg || !profileImg}
                    onClick={handleSaveSample}
                    className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl flex justify-center items-center shadow-lg disabled:opacity-50 hover:bg-primary-500 transition-colors"
                >
                    <Save className="mr-2" size={20}/>
                    Guardar Muestra
                </button>
                
                {(!surfaceImg || !profileImg) && (
                    <p className="text-xs text-center text-gray-400 mt-2">Ambas fotos son requeridas.</p>
                )}
            </div>
        ) : (
            <>
                <h3 className="text-xs font-bold uppercase text-gray-400 px-1 mb-2">Lista de Puntos</h3>
                {campaign.points.map(p => (
                    <div 
                        key={p.id} 
                        onClick={() => handlePointClick(p)}
                        className={`p-4 rounded-xl flex justify-between items-center border transition-all ${p.status === 'sampled' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 hover:shadow-md cursor-pointer'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${p.status === 'sampled' ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                                {p.label}
                            </div>
                            <div>
                                <p className={`font-bold text-sm ${p.status === 'sampled' ? 'text-emerald-900' : 'text-gray-800'}`}>
                                    Zona {campaign.zones.find(z => z.id === p.zone_id)?.name.charAt(5)}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                    {p.status === 'sampled' ? 'Muestras listas' : 'Pendiente de captura'}
                                </p>
                            </div>
                        </div>
                        {p.status === 'sampled' ? <CheckCircle className="text-emerald-500" size={20}/> : <MapPin className="text-gray-300" size={20}/>}
                    </div>
                ))}
            </>
        )}
        
        {sampledCount > 0 && campaign.status !== 'completed' && (
            <div className="text-[10px] text-center text-amber-600 bg-amber-50 p-2 rounded-lg mt-4 flex items-center justify-center">
                <AlertTriangle size={12} className="mr-1"/>
                Nota: No recargues la página hasta finalizar el análisis o perderás las fotos capturadas.
            </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="glass-panel p-6 rounded-2xl w-full max-w-sm text-center relative animate-in zoom-in-95">
                  <button onClick={() => setShowPaymentModal(false)} className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200"><X size={16} /></button>
                  
                  <div className="bg-primary-100 p-3 rounded-full inline-block mb-4">
                      <CreditCard size={32} className="text-primary-600"/>
                  </div>
                  <h3 className="text-xl font-bold text-primary-900 mb-2">Pago Requerido</h3>
                  <p className="text-sm text-primary-700 mb-4">Se requiere un pago de <span className="font-bold text-lg text-primary-800">US${PAYMENT_AMOUNT.toFixed(2)}</span> para realizar este análisis.</p>

                  {paymentError && (
                      <div className="bg-red-50 text-red-700 text-xs p-2 rounded-lg mb-4 flex items-center justify-center">
                          <AlertTriangle size={14} className="mr-2"/>
                          {paymentError}
                      </div>
                  )}

                  <button 
                    onClick={handleSimulatedPayment}
                    disabled={paymentProcessing}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                  >
                      {paymentProcessing ? 'Procesando pago...' : `Pagar US$${PAYMENT_AMOUNT.toFixed(2)}`}
                  </button>
                  <p className="text-[10px] text-gray-400 mt-2">Esta es una simulación de pago en un entorno MVP.</p>
              </div>
          </div>
      )}
    </div>
  );
};
