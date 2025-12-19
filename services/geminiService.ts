
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, GeoDataContext, SoilAnalysisInput, FieldCampaign, FieldAnalysisReport } from "../types";
import { fetchGeoData } from "./geodataService";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export const analyzeSoil = async (
  surfaceImage: File,
  profileImage: File,
  lat: number,
  lon: number,
  accuracy: number,
  crop: string,
  parcelName: string,
  notes: string,
): Promise<AnalysisResult> => {

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  console.log('[DEBUG] API Key present:', !!apiKey, 'Length:', apiKey?.length, 'Starts with:', apiKey?.substring(0, 8));
  const ai = new GoogleGenAI({ apiKey });
  const geodata: GeoDataContext = await fetchGeoData(lat, lon, crop);

  const systemInstruction = `
Actúa como un agrónomo experto. Analiza este PUNTO DE MUESTREO específico dentro de un campo.
Devuelve JSON estricto.

Contexto:
${JSON.stringify(geodata, null, 2)}

ESQUEMA JSON:
{
  "texture": { "class": "...", "confidence": 0-1, "evidence": "..." },
  "organic_matter": { "level":"...", "estimate_pct": number, "confidence": 0-1, "evidence": "..." },
  "compaction": { "level":"...", "evidence": "...", "confidence": 0-1 },
  "surface_crusting": { "present": bool, "description": "...", "confidence": 0-1 },
  "moisture_level": { "status":"...", "depth_estimate_cm":"...", "confidence": 0-1 },
  "salinity": { "present": bool, "severity":"...", "evidence":"", "confidence": 0-1 },
  "erosion_signs": { "present": bool, "severity":"...", "evidence":"", "confidence": 0-1 },
  "estimated_pH": { "class":"...", "confidence": 0-1, "evidence":"" },
  "fauna_presence": { "present": bool, "types": [], "confidence": 0-1 },
  "satellite_indicators": { "ndvi": number, "ndvi_anomaly": number, "source":"...", "confidence":0-1 },
  "soilgrid_reference": { 
    "texture_class": "string", 
    "organic_carbon_g_kg": "string", 
    "bulk_density_kg_m3": "string", 
    "ph": "string",
    "depths": {} 
  },
  "geodata_used": { "soilgrids":true, "precipitation":true, "ndvi":true, "dem":true },
  "recommendations": [
    { "type":"...", "priority":"...", "action":"...", "rationale":"...", "expected_effect_time":"...", "confidence":0-1 }
  ],
  "summary_text": "...",
  "confidence_overall": 0-1,
  "notes": "..."
}
`;

  try {
    const surfacePart = await fileToGenerativePart(surfaceImage);
    const profilePart = await fileToGenerativePart(profileImage);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          surfacePart,
          profilePart,
          { text: "Analiza este punto de muestreo." }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.4,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const result = JSON.parse(jsonText) as AnalysisResult;
    result.timestamp = new Date().toISOString();
    result.geodata_context = geodata;
    result.original_input = { parcelName, crop, notes, location: { lat, lon, accuracy } };
    return result;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("Error al analizar las imágenes.");
  }
};

export const generateFieldReport = async (campaign: FieldCampaign, analyses: AnalysisResult[]): Promise<FieldAnalysisReport> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

  // Determine Stage Context
  const stage = campaign.parcel.stage || 'production';
  const currentMonth = new Date().getMonth();
  const season = currentMonth >= 4 && currentMonth <= 9 ? 'Temporada de Lluvias' : 'Temporada Seca';

  // Aggregate comprehensive data for the prompt
  const comprehensiveInput = {
    // Field Context
    field: {
      name: campaign.parcel.name,
      crop: campaign.parcel.crop,
      stage: stage,
      area_ha: campaign.parcel.area_hectares,
      centroid: campaign.parcel.centroid,
      season: season,
      analysis_date: new Date().toISOString()
    },
    zones: campaign.zones,
    total_sample_points: campaign.points.length,

    // Detailed analysis from each point
    point_analyses: analyses.map(a => ({
      id: a.id,
      zone: campaign.zones.find(z => z.id === campaign.points.find(p => p.analysis_result_id === a.id)?.zone_id)?.name,
      location: a.original_input?.location,

      // Physical Properties (from visual AI)
      texture: a.texture,
      compaction: a.compaction,
      surface_crusting: a.surface_crusting,

      // Chemical Properties
      organic_matter: a.organic_matter,
      estimated_pH: a.estimated_pH,
      salinity: a.salinity,

      // Biological Indicators
      fauna_presence: a.fauna_presence,

      // Satellite Data
      satellite: a.satellite_indicators,

      // Moisture
      moisture: a.moisture_level,

      // Erosion
      erosion: a.erosion_signs,

      // Geodata Context (SoilGrids, Climate, etc)
      geodata: a.geodata_context,

      // Original recommendations per point
      point_recommendations: a.recommendations
    }))
  };

  const systemInstruction = `
Eres un CONSULTOR AGRÓNOMO SENIOR especializado en Agricultura de Precisión con más de 20 años de experiencia.
Tu tarea es generar un INFORME TÉCNICO INTEGRAL basado en el cruce de múltiples fuentes de datos.

=== DATOS DE ENTRADA ===
${JSON.stringify(comprehensiveInput, null, 2)}

=== CONTEXTO DEL CAMPO ===
- Cultivo: ${campaign.parcel.crop}
- Etapa: ${stage === 'preparation' ? 'PREPARACIÓN DE SUELO (pre-siembra)' : 'PRODUCCIÓN (cultivo establecido)'}
- Época del Año: ${season}
- Área Total: ${campaign.parcel.area_hectares} hectáreas

=== INSTRUCCIONES DE ANÁLISIS ===

Debes generar un informe que integre los siguientes 6 PILARES DE ANÁLISIS:

1. ANÁLISIS DE SALUD FÍSICA Y ESTRUCTURAL
   - Diagnóstico de Compactación Multicapa: Cruza imagen de perfil + densidad aparente de SoilGrids
   - Evaluación de Macro-porosidad: Analiza estructura granular vs. masiva
   - Estabilidad Superficial: Detecta encostramiento correlacionado con precipitación reciente
   - Textura Híbrida: Valida textura visual vs. datos históricos SoilGrids

2. BALANCE HÍDRICO Y DINÁMICA DEL AGUA
   - Reserva de Agua Útil: Integra textura + materia orgánica + profundidad efectiva
   - Riesgo Infiltración/Escorrentía: Pendiente (DEM) + textura + intensidad lluvias
   - Déficit de Humedad Crítico: ET0 vs. precipitación acumulada 30 días
   - Drenaje Edafocuático: Evalúa moteados en perfil (saturación prolongada)

3. POTENCIAL QUÍMICO Y BIOLÓGICO
   - Materia Orgánica Dinámica: Color Munsell vs. Carbono Orgánico SoilGrids
   - Zonificación de Fertilidad: NDVI histórico + propiedades físico-químicas
   - Disponibilidad de Nutrientes por pH: SoilGrids pH + presencia visual sales/carbonatos
   - Actividad Biológica: Fauna edáfica detectada (lombrices, galerías)

4. VIGILANCIA DE RIESGOS AGRONÓMICOS
   - Erosión Activa: Surcos/cárcavas visuales + pendiente + cobertura NDVI
   - Salinidad Estacional: Eflorescencias + alta evaporación + baja precipitación
   - Lixiviación: Suelos arenosos + alta precipitación reciente = pérdida de N

5. ANÁLISIS ESTRATÉGICO POR ETAPA DEL CULTIVO
   ${stage === 'preparation' ? `
   - Ajuste de Siembra: Profundidad y densidad según humedad + textura
   - Fertilización de Fondo: NPK base + corrección de pH
   - Preparación Mecánica: "Punto de sazón" óptimo para maquinaria` : `
   - Fertilización de Cobertera: Dosis N según NDVI actual vs. potencial del suelo
   - Fertirriego Optimizado: Calendario por etapa fenológica
   - Correcciones Foliares: Micronutrientes según deficiencias detectadas`}

6. ANÁLISIS TEMPORAL Y COMPARATIVO
   - **IMPORTANTE**: Si los datos de NDVI son null, "no disponible", o no existen, NO generes interpretaciones inventadas.
   - Si NDVI.current es null: temporal_comparison.ndvi_anomaly.current_vs_historical DEBE ser exactamente "N/A" (solo esas 3 letras)
   - Si NDVI.current es null: temporal_comparison.ndvi_anomaly.interpretation DEBE ser exactamente "N/A"  
   - NO escribas frases como "No hay datos disponibles..." o "La ausencia de datos limita..."
   - SOLO si NDVI.current tiene un valor numérico real, entonces genera el análisis de anomalías
   - Evolución Estacional: Cambios humedad/estructura según temporada (${season})

=== INSTRUCCIONES ESPECIALES PARA FERTILIZACIÓN Y RIEGO ===

**PROGRAMA DE FERTILIZACIÓN (OBLIGATORIO):**
- SIEMPRE genera el programa completo del ciclo del cultivo, independientemente de la etapa actual.
- Incluye TODAS las etapas fenológicas: Pre-siembra, Siembra, Emergencia-V6, V6-Floración, Floración-Llenado, Madurez.
- Para cada etapa especifica: días desde siembra (0-7, 15-30, 30-60, 60-90, 90-120), producto, dosis/ha, método.
- Añade notas específicas para cultivo de temporal (sin riego) en cada aplicación.

**RECOMENDACIONES DE RIEGO (OBLIGATORIO):**
- Evalúa disponibilidad de agua según precipitación de los últimos 30 días y contexto regional.
- Genera DOS escenarios:
  1. CON RIEGO: Frecuencia, volumen, etapas críticas, compatibilidad con fertirriego.
  2. TEMPORAL (secano): Estrategias de conservación de humedad, mulching, fechas óptimas de siembra según lluvias históricas, mitigación de sequía.
- Si los datos de precipitación indican zona seca o semi-árida, prioriza las recomendaciones de temporal.

=== ESQUEMA JSON DE SALIDA (ESTRICTO) ===
{
  "report_metadata": {
    "generated_at": "ISO datetime",
    "field_name": "string",
    "crop": "string",
    "stage": "string",
    "season": "string",
    "area_ha": number,
    "sample_points_analyzed": number,
    "location": { "lat": number, "lon": number }
  },
  
  "executive_summary": {
    "overall_health": "excellent|good|fair|poor|critical",
    "soil_type_dominant": "string",
    "main_conclusion": "string (2-3 oraciones resumen ejecutivo)",
    "immediate_actions_required": ["string"],
    "confidence_score": number (0-100)
  },
  
  "physical_structural_analysis": {
    "compaction_diagnosis": {
      "level": "none|low|moderate|severe",
      "affected_layers": "string",
      "evidence": "string",
      "impact_on_roots": "string"
    },
    "macroporosity": {
      "rating": "excellent|good|limited|poor",
      "structure_type": "string (granular, blocky, massive)",
      "gas_exchange_capacity": "string"
    },
    "surface_stability": {
      "crusting_present": boolean,
      "cause": "string",
      "infiltration_impact": "string"
    },
    "texture_validation": {
      "visual_class": "string",
      "soilgrids_class": "string",
      "confidence": "string",
      "discrepancy_notes": "string"
    }
  },
  
  "water_dynamics_analysis": {
    "available_water_capacity": {
      "estimate_mm": "string",
      "rating": "high|medium|low",
      "factors": "string"
    },
    "infiltration_runoff_risk": {
      "risk_level": "low|moderate|high",
      "slope_factor": "string",
      "texture_factor": "string",
      "recent_rainfall_impact": "string"
    },
    "moisture_deficit": {
      "current_status": "adequate|moderate_stress|severe_stress",
      "et0_vs_precipitation": "string",
      "irrigation_recommendation": "string"
    },
    "drainage_assessment": {
      "status": "well_drained|moderately_drained|poorly_drained",
      "waterlogging_signs": boolean,
      "evidence": "string"
    }
  },
  
  "chemical_biological_analysis": {
    "organic_matter": {
      "estimated_level": "very_low|low|medium|high",
      "visual_munsell_correlation": "string",
      "soilgrids_soc": "string",
      "improvement_potential": "string"
    },
    "fertility_zonation": {
      "zones_identified": [
        {
          "zone_name": "string",
          "fertility_class": "high|medium|low",
          "ndvi_indicator": number,
          "limiting_factors": ["string"]
        }
      ]
    },
    "nutrient_availability": {
      "ph_class": "string",
      "ph_effect_on_nutrients": "string",
      "salts_carbonates_visual": "string",
      "key_nutrient_constraints": ["string"]
    },
    "biological_activity": {
      "indicators_found": ["string"],
      "soil_health_rating": "excellent|good|fair|poor",
      "regenerative_potential": "string"
    }
  },
  
  "agronomic_risks": {
    "erosion_risk": {
      "level": "none|low|moderate|high|severe",
      "type": "string (laminar, surcos, cárcavas)",
      "visual_evidence": "string",
      "contributing_factors": ["string"],
      "mitigation": "string"
    },
    "salinity_alert": {
      "present": boolean,
      "severity": "none|low|moderate|severe",
      "seasonal_pattern": "string",
      "affected_area_pct": "string"
    },
    "leaching_susceptibility": {
      "risk": "low|moderate|high",
      "nitrogen_loss_concern": "string",
      "management_advice": "string"
    }
  },
  
  "strategic_crop_analysis": {
    "current_stage": "string",
    "stage_specific_recommendations": [
      {
        "category": "string",
        "recommendation": "string",
        "timing": "string",
        "expected_benefit": "string"
      }
    ],
    "mechanical_operations": {
      "soil_workability": "optimal|acceptable|not_recommended",
      "compaction_risk_from_machinery": "string",
      "best_timing_window": "string"
    }
  },
  
  "temporal_comparison": {
    "ndvi_anomaly": {
      "current_vs_historical": "string",
      "interpretation": "string"
    },
    "seasonal_profile_evolution": "string"
  },
  
  "zones_detailed": [
    {
      "zone_id": "string",
      "zone_name": "string",
      "area_ha": number,
      "dominant_texture": "string",
      "ndvi_avg": number,
      "health_score": number,
      "key_issues": ["string"],
      "zone_summary": "string",
      "specific_recommendations": ["string"]
    }
  ],
  
  "problems_ranked": [
    {
      "problem": "string",
      "severity_score": number (0-100),
      "location": "string",
      "root_cause": "string",
      "data_sources_used": ["string"],
      "recommended_actions": ["string"],
      "urgency": "immediate|short_term|medium_term"
    }
  ],
  
  "action_plan": {
    "immediate_30_days": [
      { "priority": "critical|high|medium", "action": "string", "expected_result": "string", "cost_estimate": "string" }
    ],
    "short_term_90_days": [],
    "annual_365_days": []
  },
  
  "fertilization_plan": {
    "program_name": "string (ej: Programa Nutrición Maíz Ciclo Completo)",
    "adapted_to_stage": "string",
    "water_regime": "string (irrigated|rainfed|mixed - detectar según datos de precipitación y lógica regional)",
    "base_formula": {
      "npk_ratio": "string (ej: 18-46-0 + Urea posterior)",
      "nitrogen_source": "string",
      "phosphorus_source": "string",
      "potassium_source": "string",
      "micronutrients": "string"
    },
    "application_schedule": [
      {
        "phase": "string (Pre-siembra/Siembra, Emergencia-V6, V6-Floración, Floración-Llenado, Madurez)",
        "days_from_start": "string (ej: 0-7 días, 15-30 días, 30-60 días, 60-90 días)",
        "product": "string",
        "dosage_per_ha": "string",
        "application_method": "string (incorporado, banda, foliar, fertirriego, voleo)",
        "objective": "string",
        "notes_rainfed": "string (ajuste si es temporal sin riego - ej: aplicar antes de lluvia esperada, reducir dosis N)"
      }
    ],
    "total_cost_per_ha": "string (estimado en MXN)",
    "expected_roi": "string",
    "special_notes": ["string"]
  },
  
  "irrigation_recommendations": {
    "water_availability_assessment": "string (basado en precipitación histórica y actual)",
    "scenario_irrigated": {
      "frequency": "string",
      "volume_per_application": "string",
      "critical_stages": ["string"],
      "fertirriego_compatible": boolean
    },
    "scenario_rainfed": {
      "strategy": "string (ej: captación de agua de lluvia, mulching, labranza conservacionista)",
      "moisture_conservation_tips": ["string"],
      "drought_mitigation": "string",
      "planting_date_recommendation": "string (ventana óptima según lluvias históricas)"
    },
    "deficit_irrigation_advice": "string (si hay agua limitada)"
  },
  
  "final_integrated_summary": "string (un párrafo conclusivo que integre todas las fuentes de datos y dé la recomendación final más importante)",
  
  "confidence_overall": number (0-100)
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: "Genera el Informe Técnico Integral de Campo según el esquema especificado." }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });
    const report = JSON.parse(response.text || "{}");
    report.generated_at = new Date().toISOString();
    return report;
  } catch (e) {
    console.error("Field Report Gen Failed", e);
    throw e;
  }
};

export const generateDetailedReport = async (
  analysisResult: AnalysisResult,
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

  const { geodata_context, original_input } = analysisResult;
  const systemInstruction = `
    Genera un informe agronómico COMPLETO en formato JSON.
    
    Debes generar dos secciones principales:
    1. Reporte de Análisis de Suelo (basado en los datos).
    2. PLAN DE FERTILIZACIÓN (Específico para el cultivo: ${original_input.crop}).
    
    Para el Plan de Fertilización:
    - Diseña una fórmula NPK y microelementos ideal para la etapa productiva del cultivo.
    - Crea un cronograma dividido en etapas (Ej: Floración, Llenado, etc.).
    - Especifica productos comerciales genéricos (ej. Nitrato de Potasio), dosis y métodos.
    - Estima costos en MXN (Pesos Mexicanos) por hectárea.
    
    Input Data: ${JSON.stringify(analysisResult)}
    
    ESQUEMA DE SALIDA (JSON STRICT):
    {
      "parcel_info": { "date": "ISOString", "parcel_name": "string", "crop": "string", "location_str": "string" },
      "executive_summary": "string",
      "physical_properties": [ {"parameter": "string", "value": "string"} ],
      "chemical_properties": [ {"parameter": "string", "value": "string"} ],
      "recommendations": [ {"action": "string", "priority": "string", "details": "string"} ],
      "fertilization_plan": {
         "program_name": "string (ej. Programa Fertirriego Soja 2025)",
         "fertilizer_composition": {
             "name": "string (ej. Fórmula NPK 12-12-17 + Micro)",
             "macro_n": "string", "macro_p": "string", "macro_k": "string",
             "micro_elements": "string"
         },
         "stages": [
            {
               "stage_name": "string (ej. Inicio Floración)",
               "total_days_range": "string (ej. Día 1-30)",
               "objective": "string",
               "activities": [
                  {
                     "days_range": "string (ej. Día 1-10)",
                     "action": "string (ej. Aplicación foliar)",
                     "product": "string",
                     "dosage": "string",
                     "method": "string",
                     "notes": "string"
                  }
               ]
            }
         ],
         "financials": {
             "estimated_cost_per_ha": "string (ej. $4,500 MXN)",
             "currency": "MXN",
             "roi_estimated": "string (ej. 2.5:1)"
         },
         "important_notes": ["string"]
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ text: "Generar reporte detallado y plan de fertilización." }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });
    return response.text || "{}";
  } catch (e) {
    // Fallback simple
    return JSON.stringify({
      parcel_info: { date: new Date().toISOString(), parcel_name: original_input.parcelName },
      executive_summary: analysisResult.summary_text,
      physical_properties: [{ parameter: "Textura", value: analysisResult.texture.class }],
      chemical_properties: [{ parameter: "pH Estimado", value: analysisResult.estimated_pH.class }],
      recommendations: analysisResult.recommendations.map(r => ({ action: r.action, priority: r.priority, details: r.rationale }))
    });
  }
};