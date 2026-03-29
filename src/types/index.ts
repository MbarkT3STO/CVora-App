export interface CV {
  id: string;
  owner: string;
  title: string;
  description: string;
  type: 'pdf' | 'built';
  // PDF CV fields
  fileUrl?: string;
  publicId?: string;
  // Built CV fields
  cvData?: CVBuiltData;
  template?: CVTemplate;
  createdAt: string;
  updatedAt?: string;
}

export type CVTemplate = 'modern' | 'minimal' | 'bold' | 'elegant' | 'professional' | 'nova';

export interface CVBuiltData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  summary: string;
  experience: CVExperience[];
  education: CVEducation[];
  skills: CVSkillGroup[];
  languages?: CVLanguage[];
}

export interface CVExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface CVEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface CVSkillGroup {
  id: string;
  category: string;
  skills: string;
}

export interface CVLanguage {
  id: string;
  language: string;
  level: string;
}

export interface CVCreatePayload {
  title: string;
  description: string;
  fileBase64: string;
  fileName: string;
}

export interface CVBuiltCreatePayload {
  title: string;
  description: string;
  cvData: CVBuiltData;
  template: CVTemplate;
}

export interface CVBuiltUpdatePayload {
  id: string;
  title: string;
  description: string;
  cvData: CVBuiltData;
  template: CVTemplate;
}

export interface CVUpdatePayload {
  id: string;
  title: string;
  description: string;
  fileBase64?: string;
  fileName?: string;
}

export interface AuthPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  expiresAt?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ToastOptions {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}
