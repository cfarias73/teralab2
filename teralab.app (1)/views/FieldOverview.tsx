import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutGrid, Sprout, FileText, Activity, PlusCircle, RotateCcw, Loader2, Calendar } from 'lucide-react';
import { FieldCampaign, Parcel } from '../types';
import { getCampaignsForParcel, saveCampaign } from '../services/dataService';
import { delineateZones, generateSamplingPoints } from '../services/geodataService';
import { PolygonLayer } from '../components/MapLayers'; // Import PolygonLayer
import { Map, Marker } from 'pigeon-maps'; // Import Map and Marker

const satelliteProvider = (x: number, y: number, z: number) => {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
};

export const FieldOverview: React.FC = () => {
    const { parcelId } = useParams<{ parcelId: string }>();
    const navigate = useNavigate();
    const [parcel, setParcel] = useState<Parcel | null>(null);
    const [campaigns, setCampaigns] = useState<FieldCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

    useEffect(() => {
        const fetchFieldData = async () => {
            if (!parcelId) return;
            setLoading(true);
            try {
                const fetchedCampaigns = await getCampaignsForParcel(parcelId);
                setCampaigns(fetchedCampaigns);

                if (fetchedCampaigns.length > 0) {
                    // The Parcel data is embedded in each campaign, so we take it from the latest one
                    setParcel(fetchedCampaigns[0].parcel);
                }
            } catch (error) {
                console.error("Error fetching field overview data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFieldData();
    }, [parcelId]);

    const handleStartNewAnalysis = async () => {
        if (!parcel) return;
        setIsCreatingCampaign(true);
        try {
            // 1. Create a brand new FieldCampaign for this existing parcel
            const newCampaignId = `camp-${Date.now()}`;
            const newZones = delineateZones(parcel); // Recalculate zones based on current parcel definition
            const newSamplingPoints = generateSamplingPoints(parcel, newZones);

            const newCampaign: FieldCampaign = {
                id: newCampaignId,
                parcel_id: parcel.id,
                parcel: parcel, // Use the existing parcel definition
                zones: newZones,
                points: newSamplingPoints,
                status: 'planning', // Starts in planning
                created_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                global_analysis: undefined // No global analysis yet
            };

            await saveCampaign(newCampaign); // Save the new campaign
            navigate(`/campaign/${newCampaignId}`); // Navigate to Campaign to start sampling
        } catch (error) {
            console.error("Error starting new analysis:", error);
            alert("Error al iniciar nuevo análisis.");
        } finally {
            setIsCreatingCampaign(false);
        }
    };

    if (loading || !parcel) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <Loader2 className="animate-spin mb-2 text-primary-600"/>
                Cargando Campo...
            </div>
        );
    }

    const latestCampaign = campaigns[0]; // Assuming campaigns are sorted by latest
    const hasInProgressCampaign = campaigns.some(c => c.status === 'in_progress');

    return (
        <div className="h-full flex flex-col bg-gray-100 relative">
            {/* Header */}
            <div className="glass-panel p-4 z-10 flex justify-between items-center">
                <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-gray-200">
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                    <h1 className="font-bold text-primary-900">{parcel.name}</h1>
                    <p className="text-xs text-primary-600">{parcel.area_hectares.toFixed(1)} ha • {parcel.crop}</p>
                </div>
                <div>{/* Placeholder for potential actions, e.g., Edit Parcel */}</div>
            </div>

            {/* Map Context */}
            <div className="h-1/3 w-full relative">
                <Map 
                    width={370} // Added required width prop
                    height={300} // Added required height prop
                    center={parcel.centroid} zoom={14} provider={satelliteProvider}>
                    {/* Display parcel boundary */}
                    {parcel.boundary.length > 2 && (
                        <PolygonLayer 
                            coords={parcel.boundary} 
                            color="#16A34A" 
                            fillOpacity={0.3} 
                        />
                    )}
                    {/* Display points from the latest in_progress or completed campaign */}
                    {latestCampaign?.points.map(p => (
                        <Marker 
                            key={p.id} 
                            anchor={[p.lat, p.lon]} 
                            color={p.status === 'sampled' ? '#10b981' : '#f59e0b'} 
                            width={30}
                        />
                    ))}
                </Map>
            </div>

            {/* Action Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-24">
                {/* Start New Analysis Button / Resume if in progress */}
                {!hasInProgressCampaign ? (
                    <button 
                        onClick={handleStartNewAnalysis}
                        disabled={isCreatingCampaign}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {isCreatingCampaign ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle size={20} />}
                        <span>{isCreatingCampaign ? 'Creando campaña...' : 'Iniciar Nuevo Análisis'}</span>
                    </button>
                ) : (
                    <div className="glass-panel p-4 rounded-xl flex items-center justify-between bg-amber-50 border border-amber-200">
                        <div className="flex items-center space-x-3">
                            <RotateCcw size={20} className="text-amber-700" />
                            <div>
                                <h4 className="font-bold text-amber-900 text-sm">Campaña en Progreso</h4>
                                <p className="text-xs text-amber-700">Continúa el muestreo de tu última campaña.</p>
                            </div>
                        </div>
                        <button onClick={() => navigate(`/campaign/${latestCampaign?.id}`)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                            Continuar
                        </button>
                    </div>
                )}


                <h3 className="text-xs font-bold uppercase text-gray-500 px-1 mt-6">Historial de Análisis</h3>
                {campaigns.length === 0 ? (
                    <div className="glass-panel rounded-2xl flex flex-col items-center justify-center h-48 text-primary-400 border-dashed border-2 border-primary-200 mt-4">
                        <Calendar size={36} className="mb-3 opacity-50" />
                        <p className="font-medium text-sm">No hay análisis previos para este campo.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {campaigns.map(camp => (
                            <div 
                                key={camp.id}
                                onClick={() => camp.status === 'completed' ? navigate(`/field-results/${camp.id}`) : navigate(`/campaign/${camp.id}`)}
                                className="glass-panel p-4 rounded-xl cursor-pointer hover:bg-white/60 transition-all active:scale-[0.98]"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2.5 rounded-lg ${camp.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {camp.status === 'completed' ? <FileText size={20}/> : <Sprout size={20}/>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary-900 text-sm">Campaña {new Date(camp.created_at).toLocaleDateString()}</h4>
                                            <p className="text-xs text-primary-600">
                                                {camp.points.filter(p => p.status === 'sampled').length}/{camp.points.length} Puntos
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                        camp.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                        camp.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {camp.status === 'completed' ? 'Completado' : camp.status === 'in_progress' ? 'En Progreso' : 'Planificación'}
                                    </div>
                                </div>
                                
                                {camp.status === 'completed' && camp.global_analysis && (
                                    <div className="mt-2 text-xs text-primary-700 flex items-center space-x-2">
                                        <Activity size={12} className="text-primary-500"/>
                                        <span>Salud: {camp.global_analysis.field_summary.health_classification}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};