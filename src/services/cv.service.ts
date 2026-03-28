import { api } from './api';
import type { CV, CVCreatePayload, CVUpdatePayload } from '../types';

export const cvService = {
  list: () => api.get<CV[]>('cv-list'),

  create: (payload: CVCreatePayload) => api.post<CV>('cv-create', payload),

  update: (payload: CVUpdatePayload) => api.put<CV>('cv-update', payload),

  delete: (id: string, publicId: string) =>
    api.delete<{ id: string }>('cv-delete', { id, publicId }),
};
