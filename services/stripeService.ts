
import { supabase } from './supabaseClient';

const SUPABASE_URL = "https://uwetcliokuoiybdboehe.supabase.co";

export const createCheckoutSession = async (
    userId: string,
    campaignId: string
): Promise<string> => {
    const returnUrl = window.location.origin + '/#/campaign/' + campaignId;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
            userId,
            campaignId,
            returnUrl,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    return url;
};

export const recordPaymentSuccess = async (
    userId: string,
    sessionId: string,
    amount: number,
    currency: string = 'USD'
): Promise<void> => {
    const { error } = await supabase
        .from('payments')
        .insert({
            user_id: userId,
            amount: amount,
            currency: currency,
            status: 'succeeded',
            stripe_session_id: sessionId,
        });

    if (error) {
        console.error('Error recording payment:', error.message || error);
        throw new Error('Could not record payment.');
    }
};
