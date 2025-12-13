

export interface GeoLocation {
  lat: number;
  lon: number;
  accuracy: number;
}

export interface SoilAnalysisInput {
  surfaceImage: File | null;
  profileImage: File | null;
  location: GeoLocation | null;
  parcelName: string;
  crop: string;
  notes: string;
}

export interface Recommendation {
  type: 'irrigation' | 'fertilization' | 'tillage' | 'erosion_control' | 'biological_amendment' | 'other';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  expected_effect_time: string;
  confidence: number;
}

export interface AnalysisResult {
  id?: string; // Unique ID for the point analysis
  sampling_point_id?: string; // Link to the plan
  texture: {
    class: string;
    confidence: number;
    evidence: string;
  };
  organic_matter: {
    level: 'high' | 'medium' | 'low';
    estimate_pct: number | null;
    confidence: number;
    evidence: string;
  };
  compaction: {
    level: 'high' | 'medium' | 'low';
    evidence: string;
    confidence: number;
  };
  surface_crusting: {
    present: boolean;
    description: string;
    confidence: number;
  };
  moisture_level: {
    status: 'wet' | 'moist' | 'dry';
    depth_estimate_cm: string;
    confidence: number;
  };
  salinity: {
    present: boolean;
    severity: 'low' | 'medium' | 'high';
    evidence: string;
    confidence: number;
  };
  erosion_signs: {
    present: boolean;
    severity: 'low' | 'medium' | 'high';
    evidence: string;
    confidence: number;
  };
  estimated_pH: {
    class: 'acidic' | 'neutral' | 'alkaline';
    confidence: number;
    evidence: string;
  };
  fauna_presence: {
    present: boolean;
    types: string[];
    confidence: number;
  };
  satellite_indicators: {
    ndvi: number | null;
    ndvi_anomaly: number | null;
    source: string;
    confidence: number;
  };
  soilgrid_reference: {
    texture_class: string;
    organic_carbon_g_kg: string;
    bulk_density_kg_m3: string;
    ph: string;
    depths: Record<string, {
      sand: number | null;
      silt: number | null;
      clay: number | null;
      soc: number | null; // organic carbon
      bdod: number | null; // bulk density
      ph: number | null;
    }>;
  };
  geodata_used: {
    soilgrids: boolean;
    precipitation: boolean;
    ndvi: boolean;
    dem: boolean;
  };
  recommendations: Recommendation[];
  summary_text: string;
  confidence_overall: number;
  notes: string;
  timestamp: string;
  geodata_context: GeoDataContext;
  original_input: {
    parcelName: string;
    crop: string;
    notes: string;
    location: GeoLocation | null;
  };
}

export interface GeoDataContext {
  lat: number;
  lon: number;
  soilgrids: any;
  precipitation: any;
  ndvi: any;
  dem: any;
  crop_hint: string;
}

// --- NEW TYPES FOR FULL FIELD WORKFLOW ---

export interface Parcel {
  id: string;
  name: string;
  crop: string;
  stage?: 'preparation' | 'production'; // ADDED: Stage of the crop
  area_hectares: number;
  boundary: [number, number][]; // Polygon coordinates [lat, lon]
  centroid: [number, number];
  created_at: string;
}

export interface Zone {
  id: string;
  parcel_id: string;
  name: string; // e.g., "Zone A - High Vigor"
  characteristics: string; // e.g., "High NDVI, Low Slope"
  color: string; // Hex color for map visualization
  recommended_points: number;
}

export interface SamplingPoint {
  id: string;
  zone_id: string;
  parcel_id: string;
  lat: number;
  lon: number;
  label: string; // e.g., "P-01"
  status: 'pending' | 'sampled';
  analysis_result_id?: string; // Link to AnalysisResult when sampled
}

// --- FERTILIZATION PLAN STRUCTURE ---

export interface FertilizationActivity {
    days_range: string; // e.g. "Día 1-10"
    action: string;
    product: string;
    dosage: string;
    method: string; // e.g. "Foliar", "Al voleo"
    notes: string;
}

export interface FertilizationStage {
    stage_name: string; // e.g. "Inicio de Floración"
    total_days_range: string; // e.g. "Día 1-30"
    objective: string;
    activities: FertilizationActivity[];
}

export interface FertilizationPlan {
    program_name: string;
    fertilizer_composition: {
        name: string;
        macro_n: string;
        macro_p: string;
        macro_k: string;
        micro_elements: string;
    };
    stages: FertilizationStage[];
    financials: {
        estimated_cost_per_ha: string;
        currency: string;
        roi_estimated: string;
    };
    important_notes: string[];
}

export interface FieldAnalysisReport {
  field_summary: {
    area_ha: number;
    variability_index: number;
    dominant_soil: string;
    dominant_issues: string[];
    health_classification: string;
    moisture_classification: string;
    salinity_risk: string;
  };
  zones: {
    zone_id: string;
    area_ha: number;
    dominant_texture: string;
    dominant_issues: string[];
    variability_score: number;
    ndvi_avg: number;
    recommendations_zone: Recommendation[];
    summary_text: string;
  }[];
  points: any[];
  heatmaps_summary: {
    ndvi_variability: string;
    moisture_variability: string;
    salinity_distribution: string;
    compaction_distribution: string;
  };
  field_problems_ranked: {
    problem: string;
    severity: number;
    location: string;
    cause: string;
    recommended_actions: string[];
  }[];
  global_recommendations: {
    zones_specific: any;
    field_wide: any;
  };
  action_plan: {
    "30_days": any[];
    "90_days": any[];
    "365_days": any[];
  };
  final_summary_text: string;
  confidence_overall: number;
  generated_at: string;
  fertilization_plan?: FertilizationPlan; // ADDED THIS
}

export interface DetailedReport {
    parcel_info: any;
    executive_summary: string;
    physical_properties: any[];
    chemical_properties: any[];
    recommendations: any[];
    fertilization_plan?: FertilizationPlan; // Optional link to the specific plan
}

// Define FieldCampaign interface
export interface FieldCampaign {
  id: string;
  parcel_id: string;
  parcel: Parcel;
  zones: Zone[];
  points: SamplingPoint[];
  status: 'planning' | 'in_progress' | 'completed';
  created_at: string;
  last_updated: string;
  global_analysis?: FieldAnalysisReport; // Optional, populated once completed
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  free_analyses_limit: number; // New field for free trials
}

export interface ParcelSummary {
  id: string; // Parcel ID
  name: string;
  crop: string;
  area_hectares: number;
  latest_campaign_id?: string;
  latest_campaign_status?: 'planning' | 'in_progress' | 'completed';
  sampled_points_count?: number;
  total_points_count?: number;
}
