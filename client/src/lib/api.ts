import axios from "axios";
import { auth } from "./auth";

const rawBaseURL = import.meta.env.VITE_API_BASE_URL;
const baseURL = (
  rawBaseURL !== undefined && rawBaseURL !== ""
    ? rawBaseURL
    : import.meta.env.PROD
    ? ""
    : "http://localhost:5001"
).replace(/\/$/, "");

export const api = axios.create({
  baseURL,
  withCredentials: true,
});


api.interceptors.request.use(async (cfg) => {
  const { data } = await auth.getSession();
  if (data.session) {
    cfg.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes("/api/auth/");
      if (!isAuthEndpoint) {
        await auth.signOut();
      }
    }
    return Promise.reject(error);
  }
);

export const errMsg = (e: unknown) =>
  (axios.isAxiosError(e) ? e.response?.data?.error || e.response?.data?.message : undefined) ??
  "Something went wrong";

