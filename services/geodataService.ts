

import { GeoDataContext, Parcel, Zone, SamplingPoint } from '../types';

// Helper: Calculate Polygon Area (Shoelace Formula approximate)
export const calculatePolygonArea = (coords: [number, number][]): number => {
  let area = 0;
  if (coords.length < 3) return 0;

  // Simple approximation for small areas (converting lat/lon to meters roughly)
  const R = 6371000; // Earth radius
  const toRad = (x: number) => x * Math.PI / 180;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const p1 = coords[i];
    const p2 = coords[j];

    const x1 = toRad(p1[1]) * R * Math.cos(toRad(p1[0]));
    const y1 = toRad(p1[0]) * R;
    const x2 = toRad(p2[1]) * R * Math.cos(toRad(p2[0]));
    const y2 = toRad(p2[0]) * R;

    area += (x1 * y2) - (x2 * y1);
  }

  return Math.abs(area / 2) / 10000; // Convert sq meters to hectares
};

export const calculateCentroid = (coords: [number, number][]): [number, number] => {
  if (coords.length === 0) return [0, 0];
  let lat = 0, lon = 0;
  coords.forEach(c => { lat += c[0]; lon += c[1]; });
  return [lat / coords.length, lon / coords.length];
};

// Check if point is inside polygon (Ray casting algorithm)
export const isPointInPolygon = (point: [number, number], vs: [number, number][]): boolean => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// --- MOCK GENERATORS FOR FULL FIELD WORKFLOW ---

export const delineateZones = (parcel: Parcel): Zone[] => {
  // In a real app, this would use K-means clustering on NDVI/Slope pixels.
  // Here we mock 2-3 zones based on area size.
  const zones: Zone[] = [];
  const count = parcel.area_hectares > 5 ? 3 : 2;

  const types = [
    { name: 'Zona A - Alto Vigor', char: 'NDVI Alto, Suelo Profundo', color: '#10b981' }, // Green
    { name: 'Zona B - Vigor Medio', char: 'NDVI Medio, Pendiente Leve', color: '#f59e0b' }, // Amber
    { name: 'Zona C - Bajo Vigor', char: 'Estrés Hídrico, Salinidad', color: '#ef4444' }   // Red
  ];

  for (let i = 0; i < count; i++) {
    zones.push({
      id: `zone-${Date.now()}-${i}`,
      parcel_id: parcel.id,
      name: types[i].name,
      characteristics: types[i].char,
      color: types[i].color,
      recommended_points: Math.max(1, Math.round(parcel.area_hectares / count))
    });
  }
  return zones;
};

// Distance between two points in meters (Haversine approximation for small distances)
const distanceMeters = (p1: [number, number], p2: [number, number]) => {
  const R = 6371e3;
  const φ1 = p1[0] * Math.PI / 180;
  const φ2 = p2[0] * Math.PI / 180;
  const Δφ = (p2[0] - p1[0]) * Math.PI / 180;
  const Δλ = (p2[1] - p1[1]) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const generateSamplingPoints = (parcel: Parcel, zones: Zone[]): SamplingPoint[] => {
  const points: SamplingPoint[] = [];

  // 1. Calculate bounding box
  let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
  parcel.boundary.forEach(p => {
    if (p[0] < minLat) minLat = p[0];
    if (p[0] > maxLat) maxLat = p[0];
    if (p[1] < minLon) minLon = p[1];
    if (p[1] > maxLon) maxLon = p[1];
  });

  // 2. Generate Grid Candidates (more regular distribution)
  // Grid step ~ 30 meters
  const latStep = 0.00027;
  const lonStep = 0.00027;

  const candidates: [number, number][] = [];

  for (let lat = minLat; lat <= maxLat; lat += latStep) {
    for (let lon = minLon; lon <= maxLon; lon += lonStep) {
      // 3. Filter: Inside Polygon
      if (isPointInPolygon([lat, lon], parcel.boundary)) {
        // 4. Filter: Edge Buffer (Avoid points too close to boundary ~15m)
        let tooClose = false;
        // Simplified check: if polygon has many points, this is expensive, 
        // but for manual drawing it's fine.
        for (let b of parcel.boundary) {
          if (distanceMeters([lat, lon], b) < 15) {
            tooClose = true;
            break;
          }
        }
        if (!tooClose) candidates.push([lat, lon]);
      }
    }
  }

  // 5. Assign candidates to zones (Mock: Spatial Split)
  // Sort candidates by Latitude to simulate distinct zones (North/South)
  candidates.sort((a, b) => b[0] - a[0]); // Descending Lat

  const zoneChunks = Math.ceil(candidates.length / zones.length);

  let pointCounter = 1;

  zones.forEach((zone, zIdx) => {
    // Get candidates for this "zone" slice
    const start = zIdx * zoneChunks;
    const end = start + zoneChunks;
    const zoneCandidates = candidates.slice(start, end);

    // Select N points uniformly from this zone's candidates
    const needed = zone.recommended_points;

    if (zoneCandidates.length > 0) {
      // Simple uniform stride selection
      const step = Math.max(1, Math.floor(zoneCandidates.length / needed));

      for (let i = 0; i < needed; i++) {
        const candidateIndex = (i * step) % zoneCandidates.length;
        const coord = zoneCandidates[candidateIndex];

        points.push({
          id: `sp-${Date.now()}-${pointCounter}`,
          zone_id: zone.id,
          parcel_id: parcel.id,
          lat: coord[0],
          lon: coord[1],
          label: `P-${String(pointCounter).padStart(2, '0')}`,
          status: 'pending'
        });
        pointCounter++;
      }
    }
  });

  return points;
};

// AgroMonitoring API Key
const AGROMONITORING_API_KEY = import.meta.env.VITE_AGROMONITORING_API_KEY;

// Helper to calculate a small bounding box for a point (approx. 100x100m)
const getPolygonBoundingBox = (lat: number, lon: number, sizeMeters: number = 100) => {
  const EARTH_RADIUS_METERS = 6371000;
  const dLat = sizeMeters / EARTH_RADIUS_METERS * (180 / Math.PI);
  const dLon = sizeMeters / (EARTH_RADIUS_METERS * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);

  const latMin = lat - dLat / 2;
  const latMax = lat + dLat / 2;
  const lonMin = lon - dLon / 2;
  const lonMax = lon + dLon / 2;

  // AgroMonitoring expects [lon, lat] pairs
  return [
    [lonMin, latMin],
    [lonMax, latMin],
    [lonMax, latMax],
    [lonMin, latMax],
    [lonMin, latMin] // Close the polygon
  ];
};

const createOrGetAgroMonitoringPolygon = async (lat: number, lon: number): Promise<string | null> => {
  if (!AGROMONITORING_API_KEY) {
    console.warn("AgroMonitoring API Key is not configured.");
    return null;
  }

  const externalId = `point_analysis_${lat.toFixed(6).replace('.', '_')}_${lon.toFixed(6).replace('.', '_')}`; // Use underscores for valid ID
  const polygonGeoJson = {
    name: `Polygon for ${lat.toFixed(4)},${lon.toFixed(4)}`,
    external_id: externalId,
    geo_json: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [getPolygonBoundingBox(lat, lon)]
      }
    },
  };

  try {
    // Adding duplicated=true allows the API to return the existing polygon if coordinates match exactly
    const response = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons?appid=${AGROMONITORING_API_KEY}&duplicated=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(polygonGeoJson),
    });

    if (!response.ok) {
      const errorBody = await response.json();

      // If still failing with 422 because of duplication (legacy handling)
      if (response.status === 422 && errorBody.message && errorBody.message.includes('already existed polygon')) {
        // Extract the ID from the message: "Your polygon is duplicated your already existed polygon 'ID'"
        const matches = errorBody.message.match(/'([^']+)'/);
        if (matches && matches[1]) {
          console.log(`[DEBUG] Reusing existing AgroMonitoring polygon: ${matches[1]}`);
          return matches[1];
        }
      }

      console.error(`AgroMonitoring Polygon API error for ${externalId}: ${response.status} - ${JSON.stringify(errorBody)}`);
      throw new Error(`AgroMonitoring Polygon API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.id; // Returns the polygon ID
  } catch (error) {
    console.error("Failed to create/get AgroMonitoring polygon:", error);
    return null;
  }
};

const fetchAgroMonitoringNDVI = async (polygonId: string): Promise<any> => {
  if (!AGROMONITORING_API_KEY || !polygonId) {
    return {
      current: null,
      historical_mean: null,
      anomaly: null,
      source: "AgroMonitoring (API Key missing or Polygon error)"
    };
  }

  try {
    // Fetch NDVI history for the last 30 days
    const today = new Date();
    const endDate = Math.floor(today.getTime() / 1000); // Unix timestamp in seconds
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    const startDateFormatted = Math.floor(startDate.getTime() / 1000); // Unix timestamp in seconds

    const ndviHistoryUrl = `https://api.agromonitoring.com/agro/1.0/ndvi/history/${polygonId}?start=${startDateFormatted}&end=${endDate}&appid=${AGROMONITORING_API_KEY}`;
    const response = await fetch(ndviHistoryUrl);

    // Handle 404 (no data available for this polygon/time range)
    if (response.status === 404) {
      console.warn(`[AgroMonitoring] No NDVI data available for polygon ${polygonId} in the requested time range.`);
      return {
        current: null,
        historical_mean: null,
        anomaly: null,
        source: "AgroMonitoring (Sin datos satelitales para esta ubicación)"
      };
    }

    if (!response.ok) {
      // Try to parse error, but handle non-JSON responses
      let errorMsg = response.statusText;
      try {
        const errorBody = await response.json();
        errorMsg = JSON.stringify(errorBody);
      } catch {
        // Response is not JSON, use status text
      }
      console.error(`AgroMonitoring NDVI API error: ${response.status} - ${errorMsg}`);
      return {
        current: null,
        historical_mean: null,
        anomaly: null,
        source: "AgroMonitoring (Error en API)"
      };
    }

    const ndviData = await response.json();

    if (ndviData && ndviData.length > 0) {
      // Sort by date (dt is unix timestamp) to get the latest
      ndviData.sort((a: any, b: any) => b.dt - a.dt);

      const latestNdv = ndviData[0].ndvi;

      // Calculate a simple average for the recent historical mean
      const sumNdv = ndviData.reduce((sum: number, entry: any) => sum + entry.ndvi, 0);
      const averageNdv = ndviData.length > 0 ? sumNdv / ndviData.length : latestNdv;

      const anomaly = latestNdv - averageNdv;

      return {
        current: latestNdv,
        historical_mean: averageNdv,
        anomaly: anomaly,
        source: "AgroMonitoring Sentinel-2"
      };
    }
  } catch (error) {
    console.error("Failed to fetch AgroMonitoring NDVI data:", error);
  }

  return {
    current: null,
    historical_mean: null,
    anomaly: null,
    source: "AgroMonitoring (Datos no disponibles)"
  };
};


// Existing Single Point Mock
export const fetchGeoData = async (lat: number, lon: number, crop: string): Promise<GeoDataContext> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  let soilgridsData: any = {};
  let precipitationData: any = {};
  let elevationData: any = {};
  let ndviData: any = {
    current: null,
    historical_mean: null,
    anomaly: null,
    source: "N/A (AgroMonitoring not fetched)"
  };


  try {
    // 1. Fetch SoilGrids data
    // Properties: clay, sand, silt, soc (soil organic carbon), bdod (bulk density), phh2o (pH)
    const soilgridsUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${lat}&lon=${lon}&properties=clay,sand,silt,soc,bdod,phh2o&depths=0-5cm,5-15cm,15-30cm&value_limit=0,10000&thicknesses=5,15,30`;
    const soilgridsRes = await fetch(soilgridsUrl);
    if (!soilgridsRes.ok) throw new Error(`SoilGrids API error: ${soilgridsRes.statusText}`);
    const soilgridsJson = await soilgridsRes.json();

    const getSoilProperty = (property: string, depth: string) => {
      try {
        const value = soilgridsJson.properties.find((p: any) => p.property === property)
          .depths.find((d: any) => d.label === depth)
          .values.mean;
        // SoilGrids values are often scaled (e.g., clay in g/kg * 10). Adjust for common units.
        // pH is also scaled by 10
        return value / 10;
      } catch {
        return null;
      }
    };

    const getTextureClass = (clay: number | null, sand: number | null, silt: number | null) => {
      if (clay === null || sand === null || silt === null) return "desconocida";
      // Simplified texture classification (for illustration)
      if (clay > 40) return "arcilloso";
      if (sand > 70) return "arenoso";
      if (silt > 60) return "limoso";
      if (clay > 20 && sand < 50) return "franco arcilloso";
      if (sand > 50 && clay < 20) return "franco arenoso";
      return "franco";
    };

    const clay0_5 = getSoilProperty('clay', '0-5cm');
    const sand0_5 = getSoilProperty('sand', '0-5cm');
    const silt0_5 = getSoilProperty('silt', '0-5cm');
    const soc0_5 = getSoilProperty('soc', '0-5cm');
    const bdod0_5 = getSoilProperty('bdod', '0-5cm');
    const ph0_5 = getSoilProperty('phh2o', '0-5cm');

    soilgridsData = {
      texture_class: getTextureClass(clay0_5, sand0_5, silt0_5),
      organic_carbon_g_kg: soc0_5 ? soc0_5.toFixed(1) : 'N/A', // SOC in g/kg
      bulk_density_kg_m3: bdod0_5 ? (bdod0_5 * 100).toFixed(0) : 'N/A', // BDOD is often cg/cm3, convert to kg/m3 (g/cm3 * 1000)
      ph: ph0_5 ? ph0_5.toFixed(1) : 'N/A',
      depths: {
        "0-5cm": {
          sand: sand0_5,
          silt: silt0_5,
          clay: clay0_5,
          soc: soc0_5,
          bdod: bdod0_5,
          ph: ph0_5,
        },
        // Add more depths as needed from the API response
        "5-15cm": {
          sand: getSoilProperty('sand', '5-15cm'),
          silt: getSoilProperty('silt', '5-15cm'),
          clay: getSoilProperty('clay', '5-15cm'),
          soc: getSoilProperty('soc', '5-15cm'),
          bdod: getSoilProperty('bdod', '5-15cm'),
          ph: getSoilProperty('phh2o', '5-15cm'),
        },
      }
    };

  } catch (error) {
    console.warn("Failed to fetch SoilGrids data:", error);
    // Fallback to basic mock or N/A
    soilgridsData = {
      texture_class: "desconocida", organic_carbon_g_kg: "N/A", bulk_density_kg_m3: "N/A", ph: "N/A", depths: {}
    };
  }

  try {
    // 2. Fetch Open-Meteo data for precipitation (daily sum for last 7/30 days approximation)
    const today = new Date();
    const startDate7d = new Date();
    startDate7d.setDate(today.getDate() - 7);
    const startDate30d = new Date();
    startDate30d.setDate(today.getDate() - 30);

    const formatISODate = (date: Date) => date.toISOString().split('T')[0];

    // Fetch daily data for precipitation sum and average temperature for the last 30 days
    // Using `past_days` directly in open-meteo for simplification for forecast endpoint
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&past_days=30`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error(`Open-Meteo Weather API error: ${weatherRes.statusText}`);
    const weatherJson = await weatherRes.json();

    const dailyData = weatherJson.daily;
    const todayIndex = dailyData.time.findIndex((date: string) => date === formatISODate(today)); // Find today's index, might not be exact

    let precip7dSum = 0;
    let precip30dSum = 0;
    let temp7dAvg = 0;
    let tempCount = 0;

    if (dailyData && dailyData.precipitation_sum && dailyData.temperature_2m_max && dailyData.temperature_2m_min) {
      for (let i = 0; i < dailyData.time.length; i++) {
        const date = new Date(dailyData.time[i]);
        if (date >= startDate7d) { // Check if within the last 7 days
          precip7dSum += dailyData.precipitation_sum[i] || 0;
          temp7dAvg += ((dailyData.temperature_2m_max[i] || 0) + (dailyData.temperature_2m_min[i] || 0)) / 2;
          tempCount++;
        }
        if (date >= startDate30d) { // Check if within the last 30 days
          precip30dSum += dailyData.precipitation_sum[i] || 0;
        }
      }
    }

    // Adjusted 3-day sum logic to be relative to the *end* of the fetched `past_days` data, if `todayIndex` is found.
    // If todayIndex is -1 (e.g. data for today not yet available or full 30 days not fetched), fallback.
    const lastFetchedDayIndex = dailyData.time.length - 1;
    const precip3dSum = (dailyData.precipitation_sum && lastFetchedDayIndex !== -1)
      ? (dailyData.precipitation_sum.slice(Math.max(0, lastFetchedDayIndex - 2), lastFetchedDayIndex + 1).reduce((a: number, b: number) => a + b, 0)).toFixed(1)
      : 0.0;


    precipitationData = {
      "3d_sum_mm": precip3dSum,
      "7d_sum_mm": precip7dSum.toFixed(1),
      "30d_sum_mm": precip30dSum.toFixed(1),
      "avg_temp_7d": tempCount > 0 ? (temp7dAvg / tempCount).toFixed(1) : 0.0,
      "et0_daily_avg": (Math.random() * 5 + 2).toFixed(1) // Keep ET0 simulated for now as it's more complex
    };

  } catch (error) {
    console.warn("Failed to fetch Open-Meteo weather data:", error);
    precipitationData = {
      "3d_sum_mm": 0.0, "7d_sum_mm": 0.0, "30d_sum_mm": 0.0, "avg_temp_7d": 20.0, "et0_daily_avg": 3.5
    };
  }

  try {
    // 3. Fetch Open-Meteo Elevation data
    const elevationUrl = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
    const elevationRes = await fetch(elevationUrl);
    if (!elevationRes.ok) throw new Error(`Open-Meteo Elevation API error: ${elevationRes.statusText}`);
    const elevationJson = await elevationRes.json();

    elevationData = {
      elevation: elevationJson.elevation?.[0] ? elevationJson.elevation[0].toFixed(0) : 0,
      slope_pct: (Math.random() * 15).toFixed(1), // Keep slope simulated for now as it needs more complex DEM processing
      aspect: ["Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste"][Math.floor(Math.random() * 8)] // Keep aspect simulated
    };
  } catch (error) {
    console.warn("Failed to fetch Open-Meteo elevation data:", error);
    elevationData = { elevation: 0, slope_pct: 0.0, aspect: "N/A" };
  }

  // 4. Fetch NDVI from AgroMonitoring
  try {
    const polygonId = await createOrGetAgroMonitoringPolygon(lat, lon);
    if (polygonId) {
      ndviData = await fetchAgroMonitoringNDVI(polygonId);
    }
  } catch (error) {
    console.warn("Failed to fetch AgroMonitoring NDVI:", error);
    // Fallback to simulated/default if API fails
    ndviData = {
      current: 0.45 + (Math.random() - 0.5) * 0.4,
      historical_mean: 0.55,
      anomaly: -0.1,
      source: "Sentinel-2 (Simulado - Fallback)"
    };
  }


  return {
    lat,
    lon,
    soilgrids: soilgridsData,
    precipitation: precipitationData,
    ndvi: ndviData, // Use fetched NDVI data
    dem: elevationData,
    crop_hint: crop
  };
};