import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { AnalysisResult, FieldCampaign } from '../types';
import { getAnalyses, getCampaigns } from '../services/dataService';
import { MapPin, Layers, AlertTriangle, CheckCircle, AlertOctagon, X, Navigation, Filter, Leaf, ChevronRight, Calendar, Loader2, Plus, Activity, Droplet, Grid3x3, CloudSun, Wind, LayoutGrid } from 'lucide-react';
import { PolygonLayer } from '../components/MapLayers'; // Import PolygonLayer

export const SoilMap: React.FC = () => {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [campaigns, setCampaigns] = useState<FieldCampaign[]>([]);
  const [center, setCenter] = useState<[number, number]>([23.6345, -102.5528]);
  const [zoom, setZoom] = useState(5);
  const [activeLayer, setActiveLayer] = useState<'street' | 'satellite'>('street');
  const [selectedParcel, setSelectedParcel] = useState<AnalysisResult | null>(null);
  const [viewMode, setViewMode] = useState<'health' | 'ndvi' | 'texture'>('health');
  const [showZones, setShowZones] = useState(false);

  const [filterCrop, setFilterCrop] = useState<string>(() => {
    return localStorage.getItem('soil_map_filter') || 'All';
  });

  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [parcelAddress, setParcelAddress] = useState<string>('');
  const [isAddressLoading, setIsAddressLoading] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [showWeather, setShowWeather] = useState(false);

  const navigate = useNavigate();
  const [isMapLoading, setIsMapLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      try {
        const [loadedAnalyses, loadedCampaigns] = await Promise.all([
          getAnalyses(),
          getCampaigns()
        ]);

        setHistory(loadedAnalyses || []);
        setCampaigns(loadedCampaigns || []);

        let hasCenter = false;

        // Prioritize campaign centering
        if (loadedCampaigns && loadedCampaigns.length > 0) {
          setCenter(loadedCampaigns[0].parcel.centroid);
          setZoom(15);
          setShowZones(true);
          hasCenter = true;
        } else if (loadedAnalyses && loadedAnalyses.length > 0 && loadedAnalyses[0].geodata_context) {
          setCenter([loadedAnalyses[0].geodata_context.lat, loadedAnalyses[0].geodata_context.lon]);
          setZoom(14);
          hasCenter = true;
        }

        if (!hasCenter && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setCenter([position.coords.latitude, position.coords.longitude]);
              setZoom(15);
            },
            (error) => console.warn(error)
          );
        }
      } catch (error) {
        console.error('[Map] Error loading data:', error);
      } finally {
        setIsMapLoading(false);
      }
    };

    initData();
  }, []);

  useEffect(() => {
    localStorage.setItem('soil_map_filter', filterCrop);
  }, [filterCrop]);

  useEffect(() => {
    if (selectedParcel?.geodata_context) {
      setIsAddressLoading(true);
      setParcelAddress('');

      const { lat, lon } = selectedParcel.geodata_context;

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          const a = data.address;
          const location = a.village || a.town || a.city || a.hamlet || a.suburb || a.county || 'Ubicación Rural';
          const state = a.state || a.region || '';
          setParcelAddress(`${location}${state ? `, ${state}` : ''}`);
        })
        .catch(() => setParcelAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`))
        .finally(() => setIsAddressLoading(false));
    }
  }, [selectedParcel]);

  const fetchWeather = async () => {
    if (showWeather) {
      setShowWeather(false);
      return;
    }
    setIsWeatherLoading(true);
    setShowWeather(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${center[0]}&longitude=${center[1]}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=auto`);
      const data = await res.json();
      setWeatherData(data.current);
    } catch (e) { console.error(e); }
    finally { setIsWeatherLoading(false); }
  };

  const mapProvider = (x: number, y: number, z: number) => {
    if (activeLayer === 'satellite') return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  };

  const getHealthStatus = (item: AnalysisResult) => {
    if (item.salinity.severity === 'high' || item.compaction.level === 'high' || item.erosion_signs.severity === 'high') return 'critical';
    if (item.salinity.severity === 'medium' || item.compaction.level === 'medium' || item.moisture_level.status === 'dry') return 'warning';
    return 'healthy';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f97316';
      case 'healthy': return '#10b981';
      default: return '#9ca3af';
    }
  };

  const getNdviColor = (ndvi: number | null) => {
    if (ndvi === null) return '#9ca3af';
    if (ndvi < 0.2) return '#ef4444';
    if (ndvi < 0.4) return '#f97316';
    if (ndvi < 0.6) return '#eab308';
    if (ndvi < 0.8) return '#10b981';
    return '#065f46';
  };

  const getTextureColor = (textureClass: string) => {
    const t = textureClass.toLowerCase();
    if (t.includes('clay') || t.includes('arcilloso') || t.includes('arcilla')) return '#e11d48';
    if (t.includes('sand') || t.includes('arenoso')) return '#f59e0b';
    if (t.includes('silt') || t.includes('limoso')) return '#0ea5e9';
    if (t.includes('loam') || t.includes('franco')) return '#10b981';
    return '#6b7280';
  };

  const getMarkerColor = (item: AnalysisResult) => {
    if (viewMode === 'ndvi') return getNdviColor(item.satellite_indicators.ndvi);
    if (viewMode === 'texture') return getTextureColor(item.texture.class);
    return getHealthColor(getHealthStatus(item));
  };

  const getPrimaryRiskLabel = (item: AnalysisResult) => {
    if (item.salinity.severity === 'high') return 'Salinidad Alta';
    if (item.compaction.level === 'high') return 'Compactación Alta';
    if (item.erosion_signs.severity === 'high') return 'Erosión Severa';
    if (item.moisture_level.status === 'dry') return 'Sequía (Seco)';
    if (item.salinity.severity === 'medium') return 'Salinidad Media';
    if (item.compaction.level === 'medium') return 'Compactación Media';
    return 'Sin Riesgos';
  };

  const cycleViewMode = () => {
    setViewMode(prev => {
      if (prev === 'health') return 'ndvi';
      if (prev === 'ndvi') return 'texture';
      return 'health';
    });
  };

  const availableCrops = ['All', ...Array.from(new Set(history.map(item => item.original_input.crop))).filter(Boolean).sort()];
  const filteredHistory = filterCrop === 'All' ? history : history.filter(item => item.original_input.crop === filterCrop);

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    if (isPickingLocation) {
      navigate('/', { state: { manualLocation: { lat: latLng[0], lon: latLng[1] } } });
      setIsPickingLocation(false);
    } else {
      setSelectedParcel(null);
    }
  };

  return (
    <div
      className={`flex flex-col w-full relative bg-gray-100 overflow-hidden ${isPickingLocation ? 'cursor-crosshair' : ''}`}
      style={{ height: 'calc(100vh - 136px)' }} // 68px header + 68px nav
    >

      {/* Loading Overlay */}
      {isMapLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-primary-500 mb-2" size={32} />
          <p className="text-sm text-primary-700">Cargando mapa...</p>
        </div>
      )}

      {isPickingLocation && (
        <div className="absolute top-24 left-4 right-4 z-20 animate-in fade-in slide-in-from-top-4 pointer-events-none">
          <div className="bg-primary-600 text-white p-3 rounded-xl shadow-lg flex items-center justify-between backdrop-blur-md bg-opacity-90 pointer-events-auto">
            <div className="flex items-center space-x-2">
              <MapPin size={18} className="animate-bounce" />
              <span className="text-sm font-bold">Toca el mapa para seleccionar</span>
            </div>
            <button onClick={() => setIsPickingLocation(false)} className="p-1 hover:bg-white/20 rounded-full">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Glass Header */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="glass-panel p-3 rounded-xl pointer-events-auto flex items-center space-x-3">
          <div className="bg-primary-100 p-1.5 rounded-lg">
            <MapPin size={16} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-primary-900 leading-none">Puntos de Análisis</h1>
            <p className="text-[10px] text-primary-600 font-medium mt-0.5">
              {filteredHistory.length} visible{filteredHistory.length !== 1 ? 's' : ''} {filterCrop !== 'All' ? `(${filterCrop})` : ''}
            </p>
          </div>
        </div>
        {showWeather && (
          <div className="mt-2 glass-panel p-3 rounded-xl pointer-events-auto animate-in slide-in-from-top-2">
            {isWeatherLoading ? <Loader2 className="animate-spin text-primary-500" /> : weatherData ? (
              <div className="flex items-center space-x-3">
                <CloudSun size={20} className="text-amber-500" />
                <div>
                  <p className="font-bold text-sm text-primary-900">{weatherData.temperature_2m}°C</p>
                  <p className="text-[10px] text-primary-600">H: {weatherData.relative_humidity_2m}% • P: {weatherData.precipitation}mm</p>
                </div>
              </div>
            ) : <span className="text-xs text-red-400">Error clima</span>}
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2 pointer-events-auto">
        <button
          onClick={() => setActiveLayer(prev => prev === 'street' ? 'satellite' : 'street')}
          className="glass-panel p-2.5 rounded-xl text-primary-700 hover:bg-white/80 active:scale-95 transition-all shadow-lg"
          title={activeLayer === 'street' ? "Cambiar a Satélite" : "Cambiar a Mapa"}
        >
          <Layers size={20} />
        </button>

        {campaigns.length > 0 && (
          <button
            onClick={() => setShowZones(prev => !prev)}
            className={`glass-panel p-2.5 rounded-xl transition-all shadow-lg active:scale-95 ${showZones ? 'bg-emerald-100 text-emerald-800' : 'text-primary-700 hover:bg-white/80'}`}
            title="Mostrar/Ocultar Campos y Zonas"
          >
            <LayoutGrid size={20} />
          </button>
        )}

        <button
          onClick={cycleViewMode}
          className={`glass-panel p-2.5 rounded-xl transition-all shadow-lg active:scale-95 ${viewMode !== 'health' ? 'bg-primary-100 text-primary-800' : 'text-primary-700 hover:bg-white/80'}`}
          title="Cambiar Modo de Vista"
        >
          {viewMode === 'health' ? <Activity size={20} /> : viewMode === 'ndvi' ? <Leaf size={20} /> : <Grid3x3 size={20} />}
        </button>

        <button
          onClick={fetchWeather}
          className={`glass-panel p-2.5 rounded-xl transition-all shadow-lg active:scale-95 ${showWeather ? 'bg-amber-100 text-amber-700' : 'text-primary-700 hover:bg-white/80'}`}
          title="Ver Clima Local"
        >
          <CloudSun size={20} />
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={() => {
            setIsPickingLocation(prev => !prev);
            setSelectedParcel(null);
          }}
          className={`p-4 rounded-full shadow-glass-hover transition-all duration-300 transform active:scale-90 border-2 border-white/20 backdrop-blur-md flex items-center justify-center ${isPickingLocation
            ? 'bg-red-500 text-white rotate-45'
            : 'bg-primary-600 text-white hover:bg-primary-500'
            }`}
          title={isPickingLocation ? "Cancelar" : "Agregar punto"}
        >
          <Plus size={28} />
        </button>
      </div>

      <div className="absolute top-20 left-0 right-0 z-10 overflow-x-auto px-4 pb-2 flex space-x-2 pointer-events-none" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center space-x-2 pointer-events-auto pr-4">
          <div className="bg-white/40 backdrop-blur-md p-1.5 rounded-full mr-1">
            <Filter size={14} className="text-primary-800" />
          </div>
          {availableCrops.map(crop => (
            <button
              key={crop}
              onClick={() => { setFilterCrop(crop); setSelectedParcel(null); }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-sm transition-all border ${filterCrop === crop
                ? 'bg-primary-600 text-white border-primary-500 shadow-lg scale-105'
                : 'bg-white/70 text-primary-800 border-white/50 hover:bg-white/90'
                }`}
            >
              {crop === 'All' ? 'Todos' : crop}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container - Full Size */}
      <div className="absolute inset-0">
        <Map
          center={center}
          zoom={zoom}
          onBoundsChanged={({ center, zoom }) => { setCenter(center); setZoom(zoom); }}
          provider={mapProvider}
          dprs={[1, 2]}
          onClick={handleMapClick}
        >
          <ZoomControl style={{ top: 100, right: 10 }} />

          {showZones && campaigns.map(c => (
            <PolygonLayer
              key={c.id}
              coords={c.parcel.boundary}
              color="#16A34A"
              label={c.parcel.name}
            />
          ))}

          {filteredHistory.map((item, idx) => {
            if (!item.geodata_context) return null;
            const status = getHealthStatus(item);
            const color = getMarkerColor(item);
            const isSelected = selectedParcel?.timestamp === item.timestamp;

            if (viewMode === 'ndvi') {
              return (
                <Marker
                  key={`${item.timestamp}-${idx}`}
                  width={50}
                  anchor={[item.geodata_context.lat, item.geodata_context.lon]}
                  onClick={() => { setCenter([item.geodata_context.lat, item.geodata_context.lon]); setSelectedParcel(item); }}
                >
                  <div
                    className={`rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-125 z-50 ring-4 ring-white/50' : 'scale-100 hover:scale-110'}`}
                    style={{
                      backgroundColor: color, width: '40px', height: '40px', opacity: 0.85,
                      boxShadow: `0 0 15px 2px ${color}`, border: '2px solid white',
                      transform: 'translate(-50%, -50%)', cursor: 'pointer'
                    }}
                  >
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </Marker>
              );
            }

            return (
              <Marker
                key={`${item.timestamp}-${idx}`}
                width={40}
                anchor={[item.geodata_context.lat, item.geodata_context.lon]}
                onClick={() => { setCenter([item.geodata_context.lat, item.geodata_context.lon]); setSelectedParcel(item); }}
              >
                <div
                  className={`transition-transform duration-300 ${isSelected ? 'scale-125 z-50' : 'scale-100 z-10 hover:scale-110'}`}
                  style={{ transform: 'translate(-50%, -100%)', cursor: 'pointer' }}
                >
                  <div className="relative flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-glass flex items-center justify-center text-white backdrop-blur-sm"
                      style={{ backgroundColor: color }}
                    >
                      {viewMode === 'texture' ? <Grid3x3 size={16} /> : status === 'critical' ? <AlertOctagon size={16} /> : status === 'warning' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]" style={{ borderTopColor: color, marginTop: -1 }}></div>
                    <div className="w-8 h-2 bg-black/20 rounded-full blur-[2px] mt-1"></div>
                  </div>
                </div>
              </Marker>
            );
          })}
        </Map>
      </div>

      <div className="absolute bottom-1 right-1 z-0 text-[10px] text-gray-500/80 bg-white/50 px-2 py-0.5 rounded pointer-events-none backdrop-blur-sm">
        {activeLayer === 'satellite' ? 'Source: Esri, Maxar' : '© OpenStreetMap'}
      </div>

      {!selectedParcel && (
        <div className="absolute bottom-4 left-4 z-10 glass-panel p-3 rounded-xl animate-in fade-in slide-in-from-left-5 backdrop-blur-md bg-white/80">
          <h4 className="text-[10px] font-bold text-primary-800 uppercase tracking-wider mb-2 border-b border-primary-100 pb-1">
            {viewMode === 'ndvi' ? 'Vigor (NDVI)' : viewMode === 'texture' ? 'Textura' : 'Salud General'}
          </h4>
          {viewMode === 'ndvi' ? (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-[#065f46] shadow-[0_0_8px_#065f46]"></div><span className="text-[10px]">Muy Alto {'>'} 0.8</span></div>
              <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></div><span className="text-[10px]">Alto (0.6 - 0.8)</span></div>
              <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-[#eab308] shadow-[0_0_8px_#eab308]"></div><span className="text-[10px]">Medio (0.4 - 0.6)</span></div>
              <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-[#f97316] shadow-[0_0_8px_#f97316]"></div><span className="text-[10px]">Bajo (0.2 - 0.4)</span></div>
              <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]"></div><span className="text-[10px]">Muy Bajo {'<'} 0.2</span></div>
            </div>
          ) : viewMode === 'texture' ? (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-[#e11d48]"></div><span className="text-[10px]">Arcilloso</span></div>
              <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div><span className="text-[10px]">Franco</span></div>
              <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div><span className="text-[10px]">Arenoso</span></div>
              <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></div><span className="text-[10px]">Limoso</span></div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-[#10b981] border border-white shadow-sm"></div><span className="text-[10px] font-medium">Saludable</span></div>
              <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-[#f97316] border border-white shadow-sm"></div><span className="text-[10px] font-medium">Precaución</span></div>
              <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-[#ef4444] border border-white shadow-sm"></div><span className="text-[10px] font-medium">Crítico</span></div>
            </div>
          )}
        </div>
      )}

      {selectedParcel && (
        <div className="absolute bottom-4 left-4 right-4 z-20 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="glass-panel p-4 rounded-2xl bg-white/90 border-white shadow-2xl relative">
            <button onClick={(e) => { e.stopPropagation(); setSelectedParcel(null); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200"><X size={16} /></button>

            <div className="flex items-start space-x-3 pr-8">
              <div className={`p-3 rounded-xl ${getHealthColor(getHealthStatus(selectedParcel)) === '#ef4444' ? 'bg-red-100 text-red-600' : getHealthColor(getHealthStatus(selectedParcel)) === '#f97316' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <Leaf size={24} />
              </div>
              <div>
                <h3 className="font-bold text-primary-900 text-lg leading-tight">{selectedParcel.original_input.parcelName || 'Parcela Sin Nombre'}</h3>
                <div className="flex items-center space-x-2 mt-1 text-xs text-primary-600">
                  <span className="flex items-center"><Calendar size={10} className="mr-1" /> {new Date(selectedParcel.timestamp).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="font-medium bg-primary-50 px-1.5 rounded">{selectedParcel.original_input.crop}</span>
                </div>
                <div className="mt-1 flex items-center text-xs text-gray-500">
                  <MapPin size={10} className="mr-1" />
                  {isAddressLoading ? <span className="italic">Obteniendo...</span> : <span className="truncate max-w-[200px]">{parcelAddress}</span>}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
              <div><span className="text-gray-400 block mb-0.5 text-[9px]">Textura (IA)</span><span className="font-semibold text-primary-800 capitalize">{selectedParcel.texture.class.replace('_', ' ')}</span></div>
              <div><span className="text-gray-400 block mb-0.5 text-[9px]">Riesgo</span><span className={`font-bold capitalize ${getHealthStatus(selectedParcel) === 'healthy' ? 'text-emerald-600' : getHealthStatus(selectedParcel) === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>{getPrimaryRiskLabel(selectedParcel)}</span></div>
              {/* Fix: Use texture_class instead of texture */}
              <div><span className="text-gray-400 block mb-0.5 text-[9px]">SoilGrids</span><span className="font-medium text-gray-600 capitalize">{selectedParcel.soilgrid_reference?.texture_class || 'N/A'}</span></div>
              {/* Fix: Use organic_carbon_g_kg instead of organic_carbon */}
              <div><span className="text-gray-400 block mb-0.5 text-[9px]">Carbono</span><span className="font-medium text-gray-600">{selectedParcel.soilgrid_reference?.organic_carbon_g_kg ? `${selectedParcel.soilgrid_reference.organic_carbon_g_kg} g/kg` : 'N/A'}</span></div>
            </div>

            <button
              onClick={() => navigate('/results', { state: { result: selectedParcel } })}
              className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
            >
              <span>Ver Informe Completo</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};