interface APIConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

class APIClient {
  private baseURL: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: APIConfig) {
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create singleton instances for different API providers
export const flightAPI = new APIClient({
  baseURL: process.env.NEXT_PUBLIC_FLIGHT_API_URL || '/api/flights',
  apiKey: process.env.NEXT_PUBLIC_FLIGHT_API_KEY,
});

export const hotelAPI = new APIClient({
  baseURL: process.env.NEXT_PUBLIC_HOTEL_API_URL || '/api/hotels',
  apiKey: process.env.NEXT_PUBLIC_HOTEL_API_KEY,
});

export const activityAPI = new APIClient({
  baseURL: process.env.NEXT_PUBLIC_ACTIVITY_API_URL || '/api/activities',
  apiKey: process.env.NEXT_PUBLIC_ACTIVITY_API_KEY,
});

export default APIClient;