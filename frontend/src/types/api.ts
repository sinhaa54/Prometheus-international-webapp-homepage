export interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  dashboard_description?: string | null;
  tableau_url: string;
  platform: string;
  category?: string | null;
  subcategory?: string | null;
  market?: string | null;
  country_code?: string | null;
  display_order: number;
  is_active: boolean;
  owner_name?: string | null;
  owner_email?: string | null;
  tags: string[];
  last_updated_at?: string | null;
}

export interface PlatformInfo {
  name: string;
  label: string;
  accent?: string | null;
  blurb?: string | null;
  dashboard_count: number;
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface AvailableFilters {
  platforms: PlatformInfo[];
  categories: FilterOption[];
  markets: FilterOption[];
}

export interface DashboardListResponse {
  items: Dashboard[];
  total: number;
  page: number;
  page_size: number;
  available_filters: AvailableFilters;
  source_refreshed_at?: string | null;
}

export interface MetadataResponse {
  active_dashboard_count: number;
  platform_count: number;
  market_count: number;
  source_refreshed_at?: string | null;
  app_version: string;
  tableau_allowed_hosts: string[];
  tableau_open_in_new_tab: boolean;
  category_accent: string;
  category_order: string[];
  contact_mailto: string;
  feedback_url: string;
}

export type AccessCatalogIconKey = 'chart' | 'pyramid' | 'grid' | string;

export interface AccessCatalogItem {
  name: string;
  platform: string;
  category?: string | null;
  icon_key: AccessCatalogIconKey;
  meta?: string | null;
  request_url: string;
}

export interface AccessCatalogResponse {
  items: AccessCatalogItem[];
}

export interface SubmissionOut {
  request_id: string;
  submission_type: 'access' | 'feedback' | 'contact';
  status: string;
  submitted_at_utc: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
