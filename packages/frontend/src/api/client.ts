import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface VocabularyEntry {
  id: string;
  username: string;
  chineseCharacter: string;
  pinyin: string;
  hanVietnamese?: string;
  modernVietnamese?: string;
  englishMeaning?: string;
  learningNote?: string;
  chapter: number;
  createdAt: string;
  updatedAt: string;
  sharedFrom?: string;
}

export interface TranslationPreview {
  pinyin: string;
  modernVietnamese: string;
  englishMeaning: string;
}

export const vocabularyApi = {
  getAll: (username: string, chapterStart?: number, chapterEnd?: number) =>
    apiClient.get<VocabularyEntry[]>(`/${username}/vocabulary`, {
      params: { chapterStart, chapterEnd },
    }),

  getById: (username: string, id: string) =>
    apiClient.get<VocabularyEntry>(`/${username}/vocabulary/${id}`),

  create: (username: string, data: Partial<VocabularyEntry>) =>
    apiClient.post<VocabularyEntry>(`/${username}/vocabulary`, data),

  update: (username: string, id: string, data: Partial<VocabularyEntry>) =>
    apiClient.put<VocabularyEntry>(`/${username}/vocabulary/${id}`, data),

  delete: (username: string, id: string) =>
    apiClient.delete(`/${username}/vocabulary/${id}`),

  previewTranslation: (username: string, chineseCharacter: string, pinyin?: string, modernVietnamese?: string, englishMeaning?: string) =>
    apiClient.post<TranslationPreview>(`/${username}/vocabulary/translate`, {
      chineseCharacter,
      pinyin,
      modernVietnamese,
      englishMeaning,
    }),

  getChapters: (username: string) =>
    apiClient.get<number[]>(`/${username}/vocabulary/chapters`),

  share: (username: string, sourceUsername: string, chapter: number) =>
    apiClient.post(`/${username}/vocabulary/share`, {
      sourceUsername,
      chapter,
    }),

  getSharedSources: (chapter: number) =>
    apiClient.get<string[]>(`/vocabulary/shared`, { params: { chapter } }),

  getAllUsers: () =>
    apiClient.get<string[]>(`/vocabulary/users`),

  createUser: (username: string) =>
    apiClient.post(`/vocabulary/users`, { username }),

  deleteUser: (username: string) =>
    apiClient.delete(`/vocabulary/users/${username}`),

  batchUpload: (username: string, characters: string, chapter: number) =>
    apiClient.post(`/${username}/vocabulary/batch`, { characters, chapter }),
};

export const adminApi = {
  authenticate: (password: string) =>
    apiClient.post<{ success: boolean; token?: string; expiresIn?: number }>('/admin/authenticate', { password }),

  backup: (token: string) =>
    apiClient.get('/admin/backup', { 
      headers: { Authorization: `Bearer ${token}` }
    }),

  restore: (file: File, token: string) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const backupData = JSON.parse(content);
          
          const response = await apiClient.post('/admin/restore', backupData, {
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          });
          resolve(response);
        } catch (error: any) {
          console.error('Import failed:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
};

export const ttsApi = {
  pronounce: (text: string) =>
    apiClient.get<{ audioUrl: string; format: string; duration: number }>('/tts/pronounce', {
      params: { text },
    }),
};
