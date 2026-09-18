import { apiRequest } from './client';
import type {
  AccessCatalogResponse,
  DashboardListResponse,
  MetadataResponse,
  SubmissionOut,
  Dashboard,
} from '../types/api';

export interface ListDashboardsParams {
  search?: string;
  platform?: string;
  category?: string;
  market?: string;
  page?: number;
  page_size?: number;
  sort_by?: 'display_order' | 'name' | 'platform' | 'last_updated_at';
  sort_direction?: 'asc' | 'desc';
  signal?: AbortSignal;
}

export function listDashboards(p: ListDashboardsParams = {}): Promise<DashboardListResponse> {
  const { signal, ...query } = p;
  return apiRequest<DashboardListResponse>('/v1/dashboards', { query, signal });
}

export function getDashboard(id: string, signal?: AbortSignal): Promise<Dashboard> {
  return apiRequest<Dashboard>(`/v1/dashboards/${encodeURIComponent(id)}`, { signal });
}

export function getMetadata(signal?: AbortSignal): Promise<MetadataResponse> {
  return apiRequest<MetadataResponse>('/v1/metadata', { signal });
}

export function getAccessCatalog(signal?: AbortSignal): Promise<AccessCatalogResponse> {
  return apiRequest<AccessCatalogResponse>('/v1/access-catalog', { signal });
}

export function submitAccessRequest(payload: {
  name: string;
  email: string;
  platform?: string;
  dashboard_id?: string;
  reason?: string;
}): Promise<SubmissionOut> {
  return apiRequest<SubmissionOut>('/v1/access-requests', { method: 'POST', body: payload });
}

export function submitFeedback(payload: {
  email?: string;
  dashboard_id?: string;
  rating?: number;
  message: string;
}): Promise<SubmissionOut> {
  return apiRequest<SubmissionOut>('/v1/feedback', { method: 'POST', body: payload });
}

export function submitContact(payload: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<SubmissionOut> {
  return apiRequest<SubmissionOut>('/v1/contact', { method: 'POST', body: payload });
}
