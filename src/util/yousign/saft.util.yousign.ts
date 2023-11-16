import axios, { AxiosRequestConfig } from "axios";
import env from "../constants/env";

export const axiosInstance = axios.create({
  baseURL: env.youSignUrl,
  timeout: 100000,
});

axiosInstance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = env.youSignApiKey;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);
