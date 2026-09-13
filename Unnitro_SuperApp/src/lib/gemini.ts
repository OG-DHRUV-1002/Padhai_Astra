/**
 * Centralized Gemini API utility for Unnitro SuperApp.
 * Provides per-feature key pools, random key selection, and retry/fallback logic.
 * Replicated from Arcpedia_3.0v architecture.
 */

export type GeminiFeature =
    | 'dashboard'
    | 'arctable'
    | 'progress'
    | 'archi'
    | 'reactor'
    | 'booklm'
    | 'laugharc';

const FEATURE_KEY_MAP: Record<GeminiFeature, string[]> = {
    dashboard: ['GEMINI_KEY_DASHBOARD'],
    arctable: ['GEMINI_KEY_ARCTABLE'],
    progress: ['GEMINI_KEY_PROGRESS'],
    archi: ['GEMINI_KEY_ARCHI'],
    reactor: ['GEMINI_KEY_REACTOR_1', 'GEMINI_KEY_REACTOR_2', 'GEMINI_KEY_REACTOR_3'],
    booklm: ['GEMINI_KEY_BOOKLM_1', 'GEMINI_KEY_BOOKLM_2', 'GEMINI_KEY_BOOKLM_3', 'GEMINI_KEY_BOOKLM_4'],
    laugharc: ['GEMINI_KEY_LAUGHARC_1', 'GEMINI_KEY_LAUGHARC_2', 'GEMINI_KEY_LAUGHARC_3'],
};

/** Get all valid API keys for a feature */
export function getKeysForFeature(feature: GeminiFeature): string[] {
    const envNames = FEATURE_KEY_MAP[feature];
    const keys = envNames
        .map((name) => process.env[name])
        .filter((k): k is string => !!k && k.length > 0);

    // Fallback to legacy generic keys if feature keys missing
    if (keys.length === 0) {
        const fallback = [
            process.env.GOOGLE_GENAI_API_KEY,
            process.env.GOOGLE_GENAI_API_KEY_1,
            process.env.GOOGLE_GENAI_API_KEY_2,
        ].filter((k): k is string => !!k && k.length > 0);
        return fallback;
    }
    return keys;
}

/** Pick a random key from the pool */
function pickRandomKey(keys: string[]): string {
    return keys[Math.floor(Math.random() * keys.length)];
}

/** Raw Gemini REST call */
async function rawGeminiCall(
    apiKey: string,
    model: string,
    contents: any[]
): Promise<Response> {
    return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
        }
    );
}

export interface GeminiCallOptions {
    /** Which feature's key pool to use */
    feature: GeminiFeature;
    /** The prompt string */
    prompt: string;
    /** Primary model (default: gemini-2.5-flash) */
    model?: string;
    /** Fallback model (default: gemini-2.0-flash) */
    fallbackModel?: string;
}

/**
 * Call Gemini with automatic key rotation and model fallback.
 * Tries all keys for the feature before giving up.
 * Returns the text content from the response.
 */
export async function callGemini(options: GeminiCallOptions): Promise<string> {
    const {
        feature,
        prompt,
        model = 'gemini-2.5-flash',
        fallbackModel = 'gemini-2.0-flash',
    } = options;

    const keys = getKeysForFeature(feature);
    if (keys.length === 0) {
        throw new Error(`No Gemini API keys configured for feature: ${feature}`);
    }

    // Shuffle keys for load distribution
    const shuffled = [...keys].sort(() => Math.random() - 0.5);
    const contents = [{ parts: [{ text: prompt }] }];

    let lastError: string = 'Unknown error';

    for (const key of shuffled) {
        try {
            // Try primary model
            let response = await rawGeminiCall(key, model, contents);

            // If rate-limited on primary, try fallback model with same key
            if (response.status === 429 && fallbackModel) {
                console.warn(`[Gemini/${feature}] Key ...${key.slice(-4)} rate limited on ${model}, trying ${fallbackModel}`);
                response = await rawGeminiCall(key, fallbackModel, contents);
            }

            if (response.status === 429) {
                console.warn(`[Gemini/${feature}] Key ...${key.slice(-4)} rate limited on both models.`);
                lastError = 'Rate limit exceeded on all models';
                continue;
            }

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[Gemini/${feature}] Key ...${key.slice(-4)} error ${response.status}: ${errText}`);
                lastError = `API Error ${response.status}`;
                continue;
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
                return text;
            }

            lastError = 'Empty response from Gemini';
            console.warn(`[Gemini/${feature}] Key ...${key.slice(-4)} returned empty content.`);
        } catch (err: any) {
            console.error(`[Gemini/${feature}] Key ...${key.slice(-4)} exception:`, err);
            lastError = err.message;
        }
    }

    throw new Error(`[Gemini/${feature}] All keys failed. Last error: ${lastError}`);
}

/**
 * Call Gemini and parse the response as JSON.
 * Strips markdown code fences before parsing.
 */
export async function callGeminiJSON<T = any>(options: GeminiCallOptions): Promise<T> {
    const raw = await callGemini(options);
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
}
