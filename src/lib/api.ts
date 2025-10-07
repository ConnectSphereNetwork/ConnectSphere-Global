import axios from "axios";

// Use environment variables for the API URL, with a fallback for local development
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://connectsphere-hcim.onrender.com/";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This is crucial for sending cookies
});

/**
 * A wrapper for our GET requests.
 * @param path The path for the API endpoint.
 * @returns The response data.
 */
export async function getJson<T = any>(path: string): Promise<T> {
  try {
    const response = await apiClient.get<T>(path);
    return response.data;
  } catch (error) {
    // Axios wraps errors, so we can extract the server's message
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "An unknown error occurred");
    }
    throw error;
  }
}

/**
 * A wrapper for our POST requests.
 * @param path The path for the API endpoint.
 * @param body The JSON payload to send.
 * @returns The response data.
 */
export async function postJson<T = any>(path: string, body: Record<string, any>): Promise<T> {
  try {
    const response = await apiClient.post<T>(path, body);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "An unknown error occurred");
    }
    throw error;
  }
}





/**
 * A wrapper for our PUT requests.
 * @param path The path for the API endpoint.
 * @param body The JSON payload to send (optional).
 * @returns The response data.
 */
export async function putJson<T = any>(path: string, body: Record<string, any> = {}): Promise<T> {
  try {
    const response = await apiClient.put<T>(path, body);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "An unknown error occurred");
    }
    throw error;
  }
}

/**
 * A wrapper for our DELETE requests.
 * @param path The path for the API endpoint.
 * @returns The response data.
 */
export async function deleteJson<T = any>(path: string): Promise<T> {
  try {
    const response = await apiClient.delete<T>(path);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "An unknown error occurred");
    }
    throw error;
  }
}