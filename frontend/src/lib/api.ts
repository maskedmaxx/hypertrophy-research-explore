import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Study {
  id: number;
  title: string;
  authors?: string;
  abstract?: string;
  publication_year?: number;
  journal?: string;
  doi?: string;
  pdf_url?: string;
  keywords?: string;
  created_at: string;
  updated_at: string;
}

export interface StudyListResponse {
  total: number;
  studies: Study[];
  page: number;
  page_size: number;
}

export interface Summary {
  id: number;
  study_id: number;
  summary_text: string;
  model_used?: string;
  created_at: string;
}

export const studiesApi = {
  list: async (params: { skip?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<StudyListResponse>('/api/studies/', { params });
    return response.data;
  },
  
  get: async (id: number) => {
    const response = await apiClient.get<Study>(`/api/studies/${id}`);
    return response.data;
  },
};

export const summariesApi = {
  create: async (studyId: number) => {
    const response = await apiClient.post<Summary>('/api/summaries/', {
      study_id: studyId,
    });
    return response.data;
  },
  
  get: async (studyId: number) => {
    const response = await apiClient.get<Summary>(`/api/summaries/${studyId}`);
    return response.data;
  },
};

export default apiClient;