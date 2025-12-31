// Service for interacting with mfapi.in for mutual fund data
const MF_API_BASE_URL = 'https://api.mfapi.in';

export interface MutualFund {
  schemeCode: string;
  schemeName: string;
}

export interface MutualFundDetails {
  meta: {
    scheme_code: string;
    scheme_name: string;
    scheme_category: string;
    scheme_type: string;
  };
  data?: Array<{
    date: string;
    nav: string;
  }>;
  status: string;
}

/**
 * Search for mutual funds by name
 * Returns list of all mutual funds (client-side filtering by name)
 */
export const searchMutualFunds = async (query: string): Promise<MutualFund[]> => {
  try {
    const response = await fetch(`${MF_API_BASE_URL}/mf`);

    if (!response.ok) {
      throw new Error('Failed to fetch mutual funds');
    }

    const allFunds: MutualFund[] = await response.json();

    // Filter by search query (case-insensitive)
    if (!query || query.trim().length === 0) {
      return allFunds.slice(0, 50); // Return first 50 if no query
    }

    const searchTerm = query.toLowerCase().trim();
    const filtered = allFunds.filter(fund =>
      fund.schemeName.toLowerCase().includes(searchTerm)
    );

    // Return top 20 matches
    return filtered.slice(0, 20);
  } catch (error) {
    console.error('Error searching mutual funds:', error);
    throw error;
  }
};

/**
 * Get details of a specific mutual fund by scheme code
 */
export const getMutualFundDetails = async (schemeCode: string): Promise<MutualFundDetails> => {
  try {
    const response = await fetch(`${MF_API_BASE_URL}/mf/${schemeCode}`);

    if (!response.ok) {
      throw new Error('Failed to fetch mutual fund details');
    }

    const details: MutualFundDetails = await response.json();
    return details;
  } catch (error) {
    console.error('Error fetching mutual fund details:', error);
    throw error;
  }
};

/**
 * Get latest NAV for a mutual fund
 */
export const getLatestNAV = async (schemeCode: string): Promise<string | null> => {
  try {
    const details = await getMutualFundDetails(schemeCode);

    if (details.data && details.data.length > 0) {
      return details.data[0].nav;
    }

    return null;
  } catch (error) {
    console.error('Error fetching latest NAV:', error);
    return null;
  }
};

