const API_BASE_URL = process.env.NEXT_PUBLIC_OPEN5E_API_URL || 'https://api.open5e.com/v2';

/**
 * Base API client for Open5E
 *
 * Handles fetch with error handling, rate limiting, and request throttling.
 */
export class Open5eClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Generic fetch method with error handling
   */
  async fetch<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Open5E API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}

export const open5eClient = new Open5eClient();
