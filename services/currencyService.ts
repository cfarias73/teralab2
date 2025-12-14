// Currency conversion service based on user's IP location

interface CurrencyInfo {
    countryCode: string;
    currency: string;
    symbol: string;
    rate: number; // Rate vs USD
}

// Approximate rates for Hispanic countries (updated periodically)
const CURRENCY_RATES: Record<string, CurrencyInfo> = {
    MX: { countryCode: 'MX', currency: 'MXN', symbol: '$', rate: 17.5 },
    AR: { countryCode: 'AR', currency: 'ARS', symbol: '$', rate: 850 },
    CO: { countryCode: 'CO', currency: 'COP', symbol: '$', rate: 4000 },
    CL: { countryCode: 'CL', currency: 'CLP', symbol: '$', rate: 900 },
    PE: { countryCode: 'PE', currency: 'PEN', symbol: 'S/', rate: 3.8 },
    EC: { countryCode: 'EC', currency: 'USD', symbol: '$', rate: 1 }, // Ecuador uses USD
    GT: { countryCode: 'GT', currency: 'GTQ', symbol: 'Q', rate: 7.8 },
    CR: { countryCode: 'CR', currency: 'CRC', symbol: '₡', rate: 530 },
    PA: { countryCode: 'PA', currency: 'USD', symbol: '$', rate: 1 }, // Panama uses USD
    DO: { countryCode: 'DO', currency: 'DOP', symbol: 'RD$', rate: 57 },
    UY: { countryCode: 'UY', currency: 'UYU', symbol: '$', rate: 40 },
    PY: { countryCode: 'PY', currency: 'PYG', symbol: '₲', rate: 7500 },
    BO: { countryCode: 'BO', currency: 'BOB', symbol: 'Bs', rate: 6.9 },
    HN: { countryCode: 'HN', currency: 'HNL', symbol: 'L', rate: 25 },
    NI: { countryCode: 'NI', currency: 'NIO', symbol: 'C$', rate: 37 },
    SV: { countryCode: 'SV', currency: 'USD', symbol: '$', rate: 1 }, // El Salvador uses USD
    ES: { countryCode: 'ES', currency: 'EUR', symbol: '€', rate: 0.92 },
    US: { countryCode: 'US', currency: 'USD', symbol: '$', rate: 1 },
};

export const getUserCurrency = async (): Promise<CurrencyInfo | null> => {
    try {
        // Use a free IP geolocation API
        const response = await fetch('https://ipapi.co/json/', {
            signal: AbortSignal.timeout(3000) // 3 second timeout
        });

        if (!response.ok) return null;

        const data = await response.json();
        const countryCode = data.country_code;

        return CURRENCY_RATES[countryCode] || null;
    } catch (error) {
        console.warn('Could not detect user currency:', error);
        return null;
    }
};

export const convertToLocalCurrency = (usdAmount: number, currencyInfo: CurrencyInfo): string => {
    const localAmount = usdAmount * currencyInfo.rate;

    // Format based on currency
    if (currencyInfo.currency === 'USD') {
        return ''; // Don't show duplicate
    }

    // Format with appropriate precision
    const formatted = localAmount >= 1000
        ? localAmount.toLocaleString('es', { maximumFractionDigits: 0 })
        : localAmount.toLocaleString('es', { maximumFractionDigits: 2 });

    return `(≈ ${currencyInfo.symbol}${formatted} ${currencyInfo.currency})`;
};
