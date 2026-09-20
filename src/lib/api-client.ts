import axios, { isAxiosError, type AxiosRequestConfig } from "axios";

import { Env } from "@/constants/env";
import { getAppAccessToken } from "@/lib/auth-storage";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const axiosInstance = axios.create({
  baseURL: Env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const accessToken = await getAppAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.status,
        error.response.statusText || error.message,
        error.response.data,
      );
    }

    throw error;
  },
);

export const apiClient = {
  get: <T>(path: string, config?: AxiosRequestConfig) =>
    axiosInstance.get<T>(path, config).then((response) => response.data),

  post: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.post<T>(path, body, config).then((response) => response.data),

  put: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.put<T>(path, body, config).then((response) => response.data),

  patch: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.patch<T>(path, body, config).then((response) => response.data),

  delete: <T>(path: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete<T>(path, config).then((response) => response.data),
};
