import { env } from '@/env';

const API_BASE_URL = env().baseUrl;
const API_KEY = env().apiKey;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = async <T>(endpoint: string): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': API_KEY,
      },
    });
    if (!response.ok) {
      throw new ApiError(
        `API request failded: ${response.status} ${response.statusText}`,
        response.status,
        response.statusText,
      );
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
