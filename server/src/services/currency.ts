import https from 'https';

// Standard fallback rates (1 Foreign Currency Unit to INR)
// e.g. 1 USD = ~86.5 INR, 1 EUR = ~92.0 INR, 1 AED = ~23.5 INR
const FALLBACK_RATES_TO_INR: Record<string, number> = {
  INR: 1.0,
  USD: 86.85,
  EUR: 92.40,
  GBP: 110.15,
  AED: 23.65,
  SGD: 64.20,
  THB: 2.45,
  JPY: 0.58,
  CAD: 61.50,
  AUD: 54.80,
  CHF: 97.20,
  MYR: 19.50,
  IDR: 0.0054,
  TRY: 2.38,
  SAR: 23.15,
  QAR: 23.85,
  NZD: 50.10,
  CNY: 11.95,
  KRW: 0.060,
  VND: 0.0034,
};

interface RateCache {
  rates: Record<string, number>; // Currency code -> INR conversion rate (1 unit of currency = X INR)
  lastUpdated: number;
}

let cachedRates: RateCache = {
  rates: { ...FALLBACK_RATES_TO_INR },
  lastUpdated: 0,
};

// Fetch exchange rates with base INR
function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 4000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

export async function updateExchangeRates(): Promise<Record<string, number>> {
  const oneHour = 60 * 60 * 1000;
  if (Date.now() - cachedRates.lastUpdated < oneHour && cachedRates.lastUpdated > 0) {
    return cachedRates.rates;
  }

  try {
    // open.er-api.com returns rates where base = INR (so rates[USD] = how many USD is 1 INR)
    // Therefore 1 USD in INR = 1 / rates[USD]
    const data = await fetchJson('https://open.er-api.com/v6/latest/INR');
    if (data && data.rates && typeof data.rates === 'object') {
      const updated: Record<string, number> = { INR: 1.0 };
      for (const [curr, inrToCurr] of Object.entries(data.rates)) {
        if (typeof inrToCurr === 'number' && inrToCurr > 0) {
          // 1 foreign unit = (1 / inrToCurr) INR
          updated[curr.toUpperCase()] = parseFloat((1 / inrToCurr).toFixed(6));
        }
      }
      cachedRates = {
        rates: updated,
        lastUpdated: Date.now(),
      };
      console.log('✅ Live currency exchange rates updated successfully.');
      return cachedRates.rates;
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch live exchange rates, using cached or fallback rates:', (error as Error).message);
  }

  return cachedRates.rates;
}

export async function getRateToInr(currency: string): Promise<number> {
  const code = (currency || 'INR').toUpperCase();
  if (code === 'INR') return 1.0;

  const rates = await updateExchangeRates();
  if (rates[code]) {
    return rates[code];
  }
  if (FALLBACK_RATES_TO_INR[code]) {
    return FALLBACK_RATES_TO_INR[code];
  }
  return 1.0;
}

export async function getAllRates(): Promise<{
  base: string;
  ratesToInr: Record<string, number>;
  lastUpdated: number;
}> {
  const rates = await updateExchangeRates();
  return {
    base: 'INR',
    ratesToInr: rates,
    lastUpdated: cachedRates.lastUpdated || Date.now(),
  };
}
