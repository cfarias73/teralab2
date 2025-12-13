
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

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Determine Stage Context for the Prompt
    const stage = campaign.parcel.stage || 'production';
    const stageDescription = stage === 'preparation' 
        ? "ETAPA DE PREPARACIÓN DE SUELO: El cultivo aún NO está establecido o está en siembra. Enfócate en fertilización de fondo, corrección de pH y estructura del suelo."
        : "ETAPA DE PRODUCCIÓN / CULTIVO ESTABLECIDO: El cultivo está creciendo. Enfócate en fertilización de mantenimiento, corrección foliar y fertirriego.";

    // Aggregate data for the prompt
    const inputData = {
        parcel: campaign.parcel,
        stage: stage,
        zones: campaign.zones,
        points: campaign.points.length,
        analyses: analyses.map(a => ({
            id: a.id,
            zone: campaign.zones.find(z => z.id === campaign.points.find(p => p.analysis_result_id === a.id)?.zone_id)?.name,
            texture: a.texture.class,
            compaction: a.compaction.level,
            salinity: a.salinity.severity,
            ph: a.estimated_pH.class,
            ndvi: a.satellite_indicators.ndvi,
            recommendations: a.recommendations.map(r => r.action)
        }))
    };

    const systemInstruction = `
    Eres un Consultor Agrónomo Senior y Especialista en IA. Genera un INFORME GLOBAL DE CAMPO JSON.
    
    Datos de Entrada: ${JSON.stringify(inputData)}
    
    CONTEXTO CRÍTICO:
    Cultivo: ${campaign.parcel.crop}
    ${stageDescription}
    
    REQUISITOS ESTRICTOS:
    1. Integra datos de satélite + visuales + geodata de cada punto.
    2. Compara puntos vs promedios de zona.
    3. Detecta anomalías y zonas de expansión de problemas (salinidad, compactación).
    4. Genera un plan de acción a 30, 90 y 365 días.
    5. GENERA UN PLAN DE FERTILIZACIÓN COMPLETO adaptado a la etapa (${stage}).
    
    ESQUEMA DE SALIDA (JSON):
    {
      "field_summary": {
        "area_ha": number,
        "variability_index": number (0-100),
        "dominant_soil": string,
        "dominant_issues": string[],
        "health_classification": "excellent"|"good"|"fair"|"poor"|"critical",
        "moisture_classification": string,
        "salinity_risk": string
      },
      "zones": [
        { 
          "zone_id": string (match input zone IDs),
          "area_ha": number,
          "dominant_texture": string,
          "dominant_issues": string[],
          "variability_score": number,
          "ndvi_avg": number,
          "summary_text": string,
          "recommendations_zone": [ { "type": string, "priority": string, "action": string, "rationale": string } ]
        }
      ],
      "heatmaps_summary": {
        "ndvi_variability": string,
        "moisture_variability": string,
        "salinity_distribution": string,
        "compaction_distribution": string
      },
      "field_problems_ranked": [
        {
          "problem": string,
          "severity": number (0-100),
          "location": string,
          "cause": string,
          "recommended_actions": string[]
        }
      ],
      "global_recommendations": {
        "zones_specific": {},
        "field_wide": {}
      },
      "action_plan": {
        "30_days": [ { "priority": string, "action": string, "benefit": string } ],
        "90_days": [],
        "365_days": []
      },
      "fertilization_plan": {
         "program_name": "string (ej. Programa Fertirriego)",
         "fertilizer_composition": {
             "name": "string (ej. Fórmula NPK)",
             "macro_n": "string", "macro_p": "string", "macro_k": "string",
             "micro_elements": "string"
         },
         "stages": [
            {
               "stage_name": "string",
               "total_days_range": "string",
               "objective": "string",
               "activities": [
                  {
                     "days_range": "string",
                     "action": "string",
                     "product": "string",
                     "dosage": "string",
                     "method": "string",
                     "notes": "string"
                  }
               ]
            }
         ],
         "financials": {
             "estimated_cost_per_ha": "string",
             "currency": "MXN",
             "roi_estimated": "string"
         },
         "important_notes": ["string"]
      },
      "final_summary_text": string,
      "confidence_overall": number
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: [{ text: "Generar Informe Global de Campo con Plan de Fertilización" }],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
  } catch(e) {
      // Fallback simple
      return JSON.stringify({
          parcel_info: { date: new Date().toISOString(), parcel_name: original_input.parcelName },
          executive_summary: analysisResult.summary_text,
          physical_properties: [{parameter: "Textura", value: analysisResult.texture.class}],
          chemical_properties: [{parameter: "pH Estimado", value: analysisResult.estimated_pH.class}],
          recommendations: analysisResult.recommendations.map(r => ({action: r.action, priority: r.priority, details: r.rationale}))
      });
  }
};