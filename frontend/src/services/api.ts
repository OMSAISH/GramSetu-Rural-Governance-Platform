const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('gramsetu_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(phone_number: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async register(userData: any) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async updateProfile(profileData: any) {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Schemes
  async getSchemes(language: string = 'en') {
    const res = await fetch(`${API_BASE_URL}/schemes?language=${language}`);
    if (!res.ok) throw new Error('Failed to load schemes');
    return res.json();
  },

  async checkEligibility(payload: any) {
    const res = await fetch(`${API_BASE_URL}/schemes/check-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to evaluate eligibility');
    return res.json();
  },

  getSchemeApplicationPdfUrl(schemeId: number, profileParams: Record<string, any>) {
    const query = new URLSearchParams();
    Object.entries(profileParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null) query.append(key, String(val));
    });
    return `${API_BASE_URL}/schemes/${schemeId}/application?${query.toString()}`;
  },

  // Grievances
  async submitGrievance(data: { description: string; language: string; category?: string }) {
    const res = await fetch(`${API_BASE_URL}/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to submit grievance' }));
      throw new Error(err.detail || 'Failed to submit');
    }
    return res.json();
  },

  async trackGrievance(trackingId: string) {
    const res = await fetch(`${API_BASE_URL}/grievances/track/${encodeURIComponent(trackingId.trim())}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Grievance not found' }));
      throw new Error(err.detail || 'Tracking ID not found');
    }
    return res.json();
  },

  async getMyGrievances() {
    const res = await fetch(`${API_BASE_URL}/grievances/my`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to load your grievances');
    return res.json();
  },

  async getOfficialGrievances(filters: { status?: string; category?: string; sla_breached_only?: boolean }) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.sla_breached_only) params.append('sla_breached_only', 'true');

    const res = await fetch(`${API_BASE_URL}/grievances?${params.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch official grievances');
    return res.json();
  },

  async updateGrievanceStatus(id: number, status: string, resolution_notes?: string) {
    const res = await fetch(`${API_BASE_URL}/grievances/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status, resolution_notes }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  // Governance
  async getGovernanceRecords(category?: string, search?: string, language: string = 'en') {
    const params = new URLSearchParams({ language });
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE_URL}/governance/records?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch governance records');
    return res.json();
  },

  // Chat
  async sendChatMessage(message: string, language: string = 'en', userId?: number) {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ message, language, user_id: userId }),
    });
    if (!res.ok) throw new Error('Chat service unavailable');
    return res.json();
  },

  // Analytics
  async getDashboardAnalytics() {
    const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async triggerSlaEscalation() {
    const res = await fetch(`${API_BASE_URL}/analytics/trigger-sla-escalation`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to trigger SLA escalation');
    return res.json();
  },
};
