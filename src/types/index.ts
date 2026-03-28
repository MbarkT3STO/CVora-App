export interface CV {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  publicId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CVCreatePayload {
  title: string;
  description: string;
  fileBase64: string;
  fileName: string;
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
