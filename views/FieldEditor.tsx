import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Draggable } from 'pigeon-maps';
import { Parcel, FieldCampaign, Zone, SamplingPoint } from '../types';
import { calculatePolygonArea, calculateCentroid, delineateZones, generateSamplingPoints, isPointInPolygon } from '../services/geodataService';
import { saveCampaign, getCampaigns } from '../services/dataService';
import { Save, Upload, Square, Trash2, Sprout, Leaf, ArrowLeft, Layers, MapPin, RefreshCw, PenTool, Tractor, TrendingUp, X, Loader2 } from 'lucide-react';
import { PolygonLayer, LineStringLayer } from '../components/MapLayers';
import { useAuth } from '../contexts/AuthContext';

const satelliteProvider = (x: number, y: number, z: number) => {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
};

export const FieldEditor: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Existing Data State
    const [existingCampaigns, setExistingCampaigns] = useState<FieldCampaign[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Parcel Data
    const [boundary, setBoundary] = useState<[number, number][]>([]);
    const [parcelName, setParcelName] = useState('');
    const [crop, setCrop] = useState('');
    const [stage, setStage] = useState<'preparation' | 'production'>('production');
    const [center, setCenter] = useState<[number, number]>([23.6345, -102.5528]);
    const [zoom, setZoom] = useState(17);

    // Planning State (Step 2)
    const [isPlanMode, setIsPlanMode] = useState(false);
    const [previewPoints, setPreviewPoints] = useState<SamplingPoint[]>([]);
    const [previewZones, setPreviewZones] = useState<Zone[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Editing State (Step 1)
    const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);

    // Resources
    const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
    const [cropSuggestions, setCropSuggestions] = useState<string[]>([]);
    const [showCustomCropInput, setShowCustomCropInput] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => setCenter([position.coords.latitude, position.coords.longitude]),
                (error) => console.warn(error),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    useEffect(() => {
        const fetchExisting = async () => {
            const campaigns = await getCampaigns();
            setExistingCampaigns(campaigns);

            const uniqueNames = [...new Set(campaigns.map((c) => c.parcel.name).filter(Boolean))];
            const defaultCrops = ['Maíz', 'Trigo', 'Soja', 'Patata', 'Arroz', 'Café', 'Pastizal', 'Aguacate', 'Agave', 'Tomate'];
            const uniqueCrops = [...new Set(campaigns.map((c) => c.parcel.crop).filter(Boolean))];

            setNameSuggestions(uniqueNames);
            const combinedCrops = Array.from(new Set([...defaultCrops, ...uniqueCrops]));
            setCropSuggestions([...combinedCrops, 'Otro']);
        };
        fetchExisting();
    }, []);

    const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
        if (isPlanMode) return;

        // Check if clicked on an existing campaign polygon to load it
        // Only allow selecting existing if we are not actively drawing a complex shape (or if current boundary is empty)
        if (boundary.length < 3 || editingId) {
            const clickedCampaign = existingCampaigns.find(c => isPointInPolygon(latLng, c.parcel.boundary));
            if (clickedCampaign && clickedCampaign.id !== editingId) {
                const shouldEdit = window.confirm(`¿Editar el campo "${clickedCampaign.parcel.name}"? Esto cargará sus datos.`);
                if (shouldEdit) {
                    setEditingId(clickedCampaign.id);
                    setBoundary(clickedCampaign.parcel.boundary);
                    setParcelName(clickedCampaign.parcel.name);
                    setCrop(clickedCampaign.parcel.crop);
                    setStage(clickedCampaign.parcel.stage || 'production');
                    // Center map on the selected parcel
                    setCenter(clickedCampaign.parcel.centroid);
                    setShowCustomCropInput(false);
                    return;
                }
            }
        }

        if (selectedVertexIdx === null) {
            setBoundary(prev => [...prev, latLng]);
        } else {
            setSelectedVertexIdx(null);
        }
    };

    const handleVertexDrag = (index: number, newCoords: [number, number]) => {
        setBoundary(prev => {
            const next = [...prev];
            next[index] = newCoords;
            return next;
        });
    };

    const handleVertexClick = (index: number) => {
        if (isPlanMode) return;
        if (selectedVertexIdx === index) {
            setSelectedVertexIdx(null);
        } else {
            setSelectedVertexIdx(index);
        }
    };

    const deleteVertex = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedVertexIdx !== null) {
            setBoundary(prev => prev.filter((_, i) => i !== selectedVertexIdx));
            setSelectedVertexIdx(null);
        }
    };

    const addRectangle = () => {
        if (isPlanMode) return;
        const d = 0.0015;
        const [cLat, cLon] = center;
        setBoundary([
            [cLat + d, cLon - d],
            [cLat + d, cLon + d],
            [cLat - d, cLon + d],
            [cLat - d, cLon - d]
        ]);
        setEditingId(null);
        setParcelName('');
        setCrop('');
        setShowCustomCropInput(false);
    };

    const handleClear = () => {
        setBoundary([]);
        setEditingId(null);
        setParcelName('');
        setCrop('');
        setShowCustomCropInput(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const json = JSON.parse(evt.target?.result as string);
                let coords: any = null;
                if (json.type === 'FeatureCollection' && json.features.length > 0) coords = json.features[0].geometry.coordinates;
                else if (json.type === 'Feature') coords = json.geometry.coordinates;
                else if (json.type === 'Polygon') coords = json.coordinates;

                if (coords) {
                    const ring = Array.isArray(coords[0][0]) ? coords[0] : coords;
                    const latLngs = ring.map((p: any) => [p[1], p[0]] as [number, number]);
                    setBoundary(latLngs);
                    if (latLngs.length > 0) setCenter(latLngs[0]);
                    setEditingId(null);
                    setShowCustomCropInput(false);
                }
            } catch (err) { alert("Error GeoJSON"); }
        };
        reader.readAsText(file);
    };

    const handleCropSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'Otro') {
            setShowCustomCropInput(true);
            setCrop('');
        } else {
            setShowCustomCropInput(false);
            setCrop(val);
        }
    };

    // --- PLAN GENERATION ---
    const generatePlan = () => {
        if (boundary.length < 3) return alert("Dibuja un polígono (mínimo 3 puntos).");
        if (!parcelName.trim()) return alert("El nombre del campo es obligatorio.");
        if (!crop.trim()) return alert("El cultivo es obligatorio.");

        const tempParcel: Parcel = {
            id: editingId ? `temp-${editingId}` : 'temp',
            name: parcelName || 'Temp',
            crop: crop || 'Temp',
            stage,
            area_hectares: calculatePolygonArea(boundary),
            boundary: boundary,
            centroid: calculateCentroid(boundary),
            created_at: new Date().toISOString()
        };

        const zones = delineateZones(tempParcel);
        const points = generateSamplingPoints(tempParcel, zones);

        setPreviewZones(zones);
        setPreviewPoints(points);
        setIsPlanMode(true);
    };

    const handlePointDrag = (anchor: [number, number], pointId: string) => {
        setPreviewPoints(prev => prev.map(p =>
            p.id === pointId ? { ...p, lat: anchor[0], lon: anchor[1] } : p
        ));
    };

    const handleSaveField = async () => {
        if (!parcelName.trim()) return alert("El nombre del campo es obligatorio.");
        if (!crop.trim()) return alert("El cultivo es obligatorio.");

        setIsSaving(true);
        try {
            let currentCampaign = editingId ? existingCampaigns.find((c: FieldCampaign) => c.id === editingId) : null;

            const newParcelId = currentCampaign ? currentCampaign.parcel_id : `p-${Date.now()}`;
            const newCampaignId = currentCampaign ? currentCampaign.id : `camp-${Date.now()}`;

            const newParcel: Parcel = {
                id: newParcelId,
                name: parcelName,
                crop,
                stage,
                area_hectares: calculatePolygonArea(boundary),
                boundary,
                centroid: calculateCentroid(boundary),
                created_at: currentCampaign ? currentCampaign.parcel.created_at : new Date().toISOString()
            };

            const finalZones = isPlanMode ? previewZones : delineateZones(newParcel);
            const finalPoints = isPlanMode ? previewPoints : generateSamplingPoints(newParcel, finalZones);

            const fixedZones = finalZones.map(z => ({ ...z, parcel_id: newParcelId }));
            const fixedPoints = finalPoints.map(p => ({ ...p, parcel_id: newParcelId }));

            const campaignToSave: FieldCampaign = {
                id: newCampaignId,
                parcel_id: newParcelId,
                parcel: newParcel,
                zones: fixedZones,
                points: fixedPoints,
                status: currentCampaign ? currentCampaign.status : 'planning',
                created_at: currentCampaign ? currentCampaign.created_at : new Date().toISOString(),
                last_updated: new Date().toISOString(),
                global_analysis: currentCampaign?.global_analysis
            };

            // If not authenticated, save to localStorage and redirect to auth
            if (!user) {
                localStorage.setItem('pendingCampaign', JSON.stringify(campaignToSave));
                navigate('/auth');
                return;
            }

            // If authenticated, save normally to Supabase
            await saveCampaign(campaignToSave);
            navigate('/');
        } catch (e: any) {
            alert("Error al guardar: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 relative">
            {/* Top Controls */}
            <div className="absolute top-4 left-4 z-20 flex flex-col space-y-3">
                <button onClick={() => navigate('/')} className="bg-white/90 backdrop-blur p-2.5 rounded-full shadow-lg text-gray-700 hover:bg-white transition-all">
                    <ArrowLeft size={22} />
                </button>

                {!isPlanMode && (
                    <div className="flex flex-col space-y-2 bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg animate-in fade-in">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <Upload size={20} />
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        </button>
                        <button onClick={addRectangle} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Nuevo Rectángulo">
                            <Square size={20} />
                        </button>
                        <button onClick={handleClear} className="p-2 hover:bg-red-50 rounded-lg text-red-500" title="Limpiar Mapa">
                            <Trash2 size={20} />
                        </button>
                    </div>
                )}

                {isPlanMode && (
                    <button
                        onClick={() => setIsPlanMode(false)}
                        className="bg-white/90 backdrop-blur p-2.5 rounded-xl shadow-lg text-primary-700 hover:bg-white transition-all flex items-center space-x-2 font-bold text-xs"
                    >
                        <Layers size={18} />
                        <span>Editar Borde</span>
                    </button>
                )}
            </div>

            {/* Editing Indicator */}
            {editingId && !isPlanMode && (
                <div className="absolute top-4 left-20 z-20">
                    <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg shadow-lg text-xs font-bold flex items-center border border-amber-300">
                        <PenTool size={14} className="mr-1.5" />
                        Editando: {parcelName}
                    </div>
                </div>
            )}

            {/* Selected Vertex Action */}
            {selectedVertexIdx !== null && !isPlanMode && (
                <div className="absolute top-4 right-4 z-20">
                    <button onClick={deleteVertex} className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm flex items-center animate-in zoom-in">
                        <Trash2 size={16} className="mr-1" /> Eliminar Punto {selectedVertexIdx + 1}
                    </button>
                </div>
            )}

            {/* Plan Mode Instruction */}
            {isPlanMode && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                    <div className="bg-primary-600/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-white text-xs font-bold flex items-center animate-in slide-in-from-top-5">
                        <MapPin size={14} className="mr-1.5 animate-bounce" />
                        Arrastra los puntos para ajustar
                    </div>
                </div>
            )}

            {/* Map */}
            <div className="flex-grow w-full h-full relative">
                <Map
                    width={370}
                    height={500}
                    center={center}
                    zoom={zoom}
                    onBoundsChanged={({ center, zoom }) => { setCenter(center); setZoom(zoom); }}
                    onClick={handleMapClick}
                    provider={satelliteProvider}
                >
                    {/* 1. Render Existing Campaigns (Ghost Polygons) */}
                    {!isPlanMode && existingCampaigns.map(camp => (
                        camp.id !== editingId && (
                            <PolygonLayer
                                key={camp.id}
                                coords={camp.parcel.boundary}
                                color="#94a3b8"
                                fillOpacity={0.2}
                            />
                        )
                    ))}

                    {/* 2. Draw Active Polygon Fill */}
                    {boundary.length > 2 && <PolygonLayer coords={boundary} color="#16A34A" fillOpacity={0.3} />}
                    {boundary.length > 0 && boundary.length < 3 && <LineStringLayer coords={boundary} />}

                    {/* 3. Vertices */}
                    {!isPlanMode && boundary.map((pt, i) => (
                        <Draggable
                            key={i}
                            anchor={pt}
                            onDragEnd={(newPos) => handleVertexDrag(i, newPos)}
                        >
                            <div
                                onClick={() => handleVertexClick(i)}
                                className={`
                            w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-lg cursor-grab active:cursor-grabbing transition-transform
                            border-2 -translate-x-1/2 -translate-y-1/2
                            ${selectedVertexIdx === i
                                        ? 'bg-red-500 border-white text-white scale-125 z-50'
                                        : 'bg-orange-500 border-white text-white hover:scale-110 z-40'
                                    }
                        `}
                            >
                                {i + 1}
                            </div>
                        </Draggable>
                    ))}

                    {/* 4. Draggable Sampling Points */}
                    {isPlanMode && previewPoints.map((p, i) => {
                        const zone = previewZones.find(z => z.id === p.zone_id);
                        return (
                            <Draggable
                                key={p.id}
                                anchor={[p.lat, p.lon]}
                                offset={[15, 28]}
                                onDragEnd={(anchor) => handlePointDrag(anchor, p.id)}
                            >
                                <div className="relative group cursor-grab active:cursor-grabbing">
                                    <MapPin
                                        size={32}
                                        className="drop-shadow-lg transition-transform hover:scale-110"
                                        style={{ color: zone?.color || '#10b981', fill: 'white' }}
                                    />
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        {p.label}
                                    </div>
                                </div>
                            </Draggable>
                        );
                    })}
                </Map>
            </div>

            {/* Bottom Inputs - Compact */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-20 bg-gradient-to-t from-black/60 via-black/30 to-transparent pb-4">
                <div className="max-w-md mx-auto space-y-2">
                    <div className="flex items-center space-x-2">
                        <div className="flex-grow bg-white/80 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/40">
                            <input
                                type="text"
                                placeholder="Nombre del campo"
                                className="w-full bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 font-medium outline-none"
                                value={parcelName}
                                onChange={e => setParcelName(e.target.value)}
                                list="parcel-suggestions"
                            />
                            <datalist id="parcel-suggestions">
                                {nameSuggestions.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                        <div className="bg-primary-700/90 backdrop-blur p-2.5 rounded-xl shadow-lg text-primary-100 border border-primary-500/50 flex items-center justify-center">
                            <Sprout size={20} />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="w-1/2 bg-white/80 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/40">
                            <div className="relative">
                                {showCustomCropInput ? (
                                    <div className="relative w-full">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent px-3 py-2.5 text-sm text-gray-900 font-medium outline-none pr-8"
                                            placeholder="Escribe cultivo..."
                                            value={crop}
                                            autoFocus
                                            onChange={(e) => setCrop(e.target.value)}
                                        />
                                        <button
                                            onClick={() => { setShowCustomCropInput(false); setCrop(''); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 p-0.5"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <select
                                            className="w-full bg-transparent px-3 py-2.5 text-sm text-gray-900 font-medium outline-none appearance-none"
                                            value={cropSuggestions.includes(crop) ? crop : (crop ? 'Otro' : '')}
                                            onChange={handleCropSelectChange}
                                        >
                                            <option value="" disabled>Cultivo...</option>
                                            {cropSuggestions.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                                            <Leaf size={14} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="w-1/2 bg-white/80 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/40">
                            <div className="relative">
                                <select
                                    className="w-full bg-transparent px-3 py-2.5 text-sm text-gray-900 font-medium outline-none appearance-none"
                                    value={stage}
                                    onChange={e => setStage(e.target.value as any)}
                                >
                                    <option value="preparation">Preparación</option>
                                    <option value="production">Producción</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                                    {stage === 'preparation' ? <Tractor size={14} /> : <TrendingUp size={14} />}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        {isPlanMode ? (
                            <button
                                onClick={handleSaveField}
                                disabled={isSaving}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 backdrop-blur-md text-white font-bold px-4 py-2.5 rounded-xl shadow-lg border border-white/20 flex items-center justify-center space-x-2 transition-transform active:scale-95 animate-in slide-in-from-bottom-2 disabled:opacity-70 text-sm"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                <span>{editingId ? 'Actualizar Campo' : 'Guardar Campo'}</span>
                            </button>
                        ) : (
                            <button
                                onClick={generatePlan}
                                className="w-full bg-white/90 hover:bg-white backdrop-blur-md text-primary-800 font-bold px-4 py-2.5 rounded-xl shadow-lg border border-white flex items-center justify-center space-x-2 transition-transform active:scale-95 text-sm"
                            >
                                <RefreshCw size={18} className="text-primary-600" />
                                <span>Generar Puntos de Muestreo</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};