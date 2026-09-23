import { apiRequest } from './client';
export function listDashboards(p = {}) {
    const { signal, ...query } = p;
    return apiRequest('/v1/dashboards', { query, signal });
}
export function getDashboard(id, signal) {
    return apiRequest(`/v1/dashboards/${encodeURIComponent(id)}`, { signal });
}
export function getMetadata(signal) {
    return apiRequest('/v1/metadata', { signal });
}
export function getAccessCatalog(signal) {
    return apiRequest('/v1/access-catalog', { signal });
}
export function submitAccessRequest(payload) {
    return apiRequest('/v1/access-requests', { method: 'POST', body: payload });
}
export function submitFeedback(payload) {
    return apiRequest('/v1/feedback', { method: 'POST', body: payload });
}
export function submitContact(payload) {
    return apiRequest('/v1/contact', { method: 'POST', body: payload });
}
