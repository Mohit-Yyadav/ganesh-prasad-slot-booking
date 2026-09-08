import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL });

// Attach admin token automatically when present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gp_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error messages so components can just read err.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || "Something went wrong. Please try again.";
    if (err.response?.status === 401 && window.location.pathname.startsWith("/admin")) {
      localStorage.removeItem("gp_admin_token");
    }
    return Promise.reject(new Error(message));
  }
);

// ---------- Public endpoints ----------
export const getAllSlots = () => api.get("/slots").then((r) => r.data);
export const getSlotsForDate = (date) => api.get(`/slots/${date}`).then((r) => r.data);
export const submitApplication = (payload) =>
  api.post("/applications", payload).then((r) => r.data);
export const fetchApplicationStatus = (params) =>
  api.get("/applications/status", { params }).then((r) => r.data);

// ---------- Admin endpoints ----------
export const adminLogin = (payload) => api.post("/admin/login", payload).then((r) => r.data);
export const adminMe = () => api.get("/admin/me").then((r) => r.data);
export const adminDashboard = () => api.get("/admin/dashboard").then((r) => r.data);
export const adminListApplications = (params) =>
  api.get("/admin/applications", { params }).then((r) => r.data);
export const adminGetApplication = (id) =>
  api.get(`/admin/applications/${id}`).then((r) => r.data);
export const adminApprove = (id) =>
  api.patch(`/admin/applications/${id}/approve`).then((r) => r.data);
export const adminReject = (id, reason) =>
  api.patch(`/admin/applications/${id}/reject`, { reason }).then((r) => r.data);
export const adminListSlots = () => api.get("/admin/slots").then((r) => r.data);
export const adminUpdateSlot = (id, status) =>
  api.patch(`/admin/slots/${id}`, { status }).then((r) => r.data);
export const adminExportUrl = () => `${baseURL}/admin/applications/export`;
