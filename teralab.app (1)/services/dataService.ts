
import { supabase } from './supabaseClient';
import { FieldCampaign, AnalysisResult, ParcelSummary } from '../types';
import { User } from '@supabase/supabase-js';

// --- CAMPAIGNS (LOTES) ---

export const getCampaigns = async (): Promise<FieldCampaign[]> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('data')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error.message || error);
    return [];
  }

  // Extract the JSON data
  return data.map((row: any) => row.data as FieldCampaign);
};

export const getCampaignById = async (id: string): Promise<FieldCampaign | null> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('data')
    .eq('app_id', id)
    .single();

  if (error) {
    console.error(`Error fetching campaign by ID ${id}:`, error.message || error); // Added logging here
    return null;
  }
  return data.data as FieldCampaign;
};

export const saveCampaign = async (campaign: FieldCampaign): Promise<void> => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("User not authenticated");

  // Check if exists to update or insert
  const { data: existing } = await supabase
    .from('campaigns')
    .select('id')
    .eq('app_id', campaign.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('campaigns')
      .update({
        name: campaign.parcel.name, // The campaign 'name' column now reflects parcel name
        parcel_id: campaign.parcel.id, // Explicitly save parcel_id in a top-level column
        status: campaign.status,
        data: campaign,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
    if (error) throw new Error(`Error updating campaign: ${error.message || error}`); // Improved error message
  } else {
    const { error } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        app_id: campaign.id,
        name: campaign.parcel.name,
        parcel_id: campaign.parcel.id, // Explicitly save parcel_id in a top-level column
        status: campaign.status,
        data: campaign
      });
    if (error) throw new Error(`Error inserting campaign: ${error.message || error}`); // Improved error message
  }
};

// --- PARCELS (NUEVAS FUNCIONES) ---

export const getParcelsWithLatestCampaignStatus = async (): Promise<ParcelSummary[]> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('data, app_id, name, status, created_at, parcel_id') // Select parcel_id from top-level column
    .order('created_at', { ascending: false }); // Order by creation to easily get latest

  if (error) {
    console.error('Error fetching campaigns for parcel summaries:', error.message || error);
    return [];
  }

  const parcelsMap = new Map<string, ParcelSummary>();

  for (const row of data) {
    const campaign = row.data as FieldCampaign; // Full campaign data
    const parcelId = row.parcel_id; // Use the top-level parcel_id for efficiency

    if (!parcelsMap.has(parcelId)) {
      // This is the latest campaign for this parcel
      parcelsMap.set(parcelId, {
        id: parcelId,
        name: campaign.parcel.name,
        crop: campaign.parcel.crop,
        area_hectares: campaign.parcel.area_hectares,
        latest_campaign_id: campaign.id,
        latest_campaign_status: campaign.status,
        sampled_points_count: campaign.points.filter(p => p.status === 'sampled').length,
        total_points_count: campaign.points.length,
      });
    }
  }
  return Array.from(parcelsMap.values());
};

export const getCampaignsForParcel = async (parcelId: string): Promise<FieldCampaign[]> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('data')
    .eq('parcel_id', parcelId) // Filter by the top-level parcel_id column
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns for parcel:', error.message || error);
    return [];
  }
  return data.map((row: any) => row.data as FieldCampaign);
};

// --- ANALYSES (HISTORIAL) ---

export const getAnalyses = async (): Promise<AnalysisResult[]> => {
  const { data, error } = await supabase
    .from('analyses')
    .select('data')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching analyses:', error.message || error);
    return [];
  }
  return data.map((row: any) => row.data as AnalysisResult);
};

export const getAnalysesByCampaign = async (campaignId: string): Promise<AnalysisResult[]> => {
    // We filter by the JSON field or a column if we indexed it. 
    // Ideally we store campaign_id in a column, which we did in the SQL.
    const { data, error } = await supabase
      .from('analyses')
      .select('data')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching analyses for campaign:', error.message || error);
      return [];
    }
    return data.map((row: any) => row.data as AnalysisResult);
};

export const saveAnalysis = async (analysis: AnalysisResult, campaignId?: string): Promise<void> => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      app_id: analysis.id, // Ensure analysis has an ID
      campaign_id: campaignId || null,
      data: analysis
    });

  if (error) throw new Error(`Error saving analysis: ${error.message || error}`); // Improved error message
};

export const clearHistory = async (): Promise<void> => {
    const { error } = await supabase.from('analyses').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if(error) throw new Error(`Error clearing history: ${error.message || error}`); // Improved error message
}

// --- PAYMENT LOGIC ---

export const getTotalAnalysesMade = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('analyses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error counting user analyses:', error.message || error);
    return 0;
  }
  return count || 0;
};

export const decrementFreeAnalysisLimit = async (userId: string): Promise<void> => {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('free_analyses_limit')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching user profile for decrement:', fetchError.message || fetchError);
    throw new Error('Could not fetch user profile to decrement free analysis limit.');
  }

  if (profile && profile.free_analyses_limit > 0) {
    const newLimit = profile.free_analyses_limit - 1;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ free_analyses_limit: newLimit })
      .eq('id', userId);

    if (updateError) {
      console.error('Error decrementing free analysis limit:', updateError.message || updateError);
      throw new Error('Could not decrement free analysis limit.');
    }
  } else {
    // This case should ideally not be reached if checks are done in Campaign.tsx,
    // but acts as a safeguard.
    console.warn(`Attempted to decrement free analysis limit for user ${userId}, but limit was already 0 or less.`);
  }
};


export const recordSimulatedPayment = async (
  userId: string,
  amount: number,
  currency: string = 'USD'
): Promise<void> => {
  const { error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      amount: amount,
      currency: currency,
      status: 'succeeded', // Siempre "succeeded" para la simulación
      // stripe_payment_intent_id: 'simulated_pi_' + Date.now(), // Descomentar para un ID más realista en simulación
    });

  if (error) {
    console.error('Error recording simulated payment:', error.message || error);
    throw new Error('Could not record simulated payment.');
  }
};
