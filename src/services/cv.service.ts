import { api } from './api';
import type { CV, CVCreatePayload, CVUpdatePayload, CVBuiltCreatePayload, CVBuiltUpdatePayload } from '../types';

export const cvService = {
  list: () => api.get<CV[]>('cv-list'),

  create: (payload: CVCreatePayload) => api.post<CV>('cv-create', payload),

  update: (payload: CVUpdatePayload) => api.put<CV>('cv-update', payload),

  delete: (id: string, publicId?: string) =>
    api.delete<{ id: string }>('cv-delete', { id, publicId }),

  createBuilt: (payload: CVBuiltCreatePayload) => api.post<CV>('cv-builder-save', payload),

  updateBuilt: (payload: CVBuiltUpdatePayload) => api.put<CV>('cv-builder-save', payload),
};
