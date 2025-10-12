/**
 * Document Store with Zustand
 *
 * Manages RAG documents, uploads, and search state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Document {
  id: string;
  title: string;
  content: string;
  organizationId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunkCount: number;
  metadata: {
    fileType?: string;
    fileSize?: number;
    uploadedAt?: string;
    processingTime?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  score: number;
  vectorScore?: number;
  textScore?: number;
  source: 'vector' | 'text' | 'both';
}

interface DocumentState {
  // Document list
  documents: Document[];
  selectedDocument: Document | null;

  // Search
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;

  // Upload
  isUploading: boolean;
  uploadProgress: number;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  setSelectedDocument: (document: Document | null) => void;

  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  clearSearch: () => void;

  setUploading: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;

  setLoading: (isLoading: boolean) => void;
  setSearching: (isSearching: boolean) => void;
  setError: (error: string | null) => void;

  // API actions
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  searchDocuments: (
    query: string,
    useHybrid?: boolean
  ) => Promise<void>;

  reset: () => void;
}

const initialState = {
  documents: [],
  selectedDocument: null,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  isUploading: false,
  uploadProgress: 0,
  isLoading: false,
  error: null,
};

export const useDocumentStore = create<DocumentState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setDocuments: (documents) => set({ documents }),

      addDocument: (document) =>
        set((state) => ({
          documents: [document, ...state.documents],
        })),

      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, ...updates } : doc
          ),
          selectedDocument:
            state.selectedDocument?.id === id
              ? { ...state.selectedDocument, ...updates }
              : state.selectedDocument,
        })),

      deleteDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
          selectedDocument:
            state.selectedDocument?.id === id
              ? null
              : state.selectedDocument,
        })),

      setSelectedDocument: (document) =>
        set({ selectedDocument: document }),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),
      clearSearch: () =>
        set({ searchQuery: '', searchResults: [] }),

      setUploading: (isUploading) => set({ isUploading }),
      setUploadProgress: (progress) => set({ uploadProgress: progress }),

      setLoading: (isLoading) => set({ isLoading }),
      setSearching: (isSearching) => set({ isSearching }),
      setError: (error) => set({ error }),

      fetchDocuments: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/rag/documents');

          if (!response.ok) {
            throw new Error('Failed to fetch documents');
          }

          const data = await response.json();
          set({ documents: data.documents, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch documents',
            isLoading: false,
          });
        }
      },

      uploadDocument: async (file: File) => {
        set({ isUploading: true, uploadProgress: 0, error: null });

        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/rag/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload document');
          }

          const data = await response.json();

          set((state) => ({
            documents: [data.document, ...state.documents],
            isUploading: false,
            uploadProgress: 100,
          }));

          // Reset upload progress after 2 seconds
          setTimeout(() => {
            set({ uploadProgress: 0 });
          }, 2000);
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to upload document',
            isUploading: false,
            uploadProgress: 0,
          });
        }
      },

      searchDocuments: async (query: string, useHybrid = true) => {
        set({ isSearching: true, searchQuery: query, error: null });

        try {
          const endpoint = useHybrid
            ? '/api/rag/hybrid-search'
            : '/api/rag/search';

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });

          if (!response.ok) {
            throw new Error('Search failed');
          }

          const data = await response.json();

          set({
            searchResults: data.results,
            isSearching: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Search failed',
            isSearching: false,
          });
        }
      },

      reset: () => set(initialState),
    }),
    { name: 'DocumentStore' }
  )
);

// Selectors
export const useDocuments = () =>
  useDocumentStore((state) => state.documents);

export const useSelectedDocument = () =>
  useDocumentStore((state) => state.selectedDocument);

export const useDocumentSearch = () =>
  useDocumentStore((state) => ({
    query: state.searchQuery,
    results: state.searchResults,
    isSearching: state.isSearching,
    search: state.searchDocuments,
    clearSearch: state.clearSearch,
  }));

export const useDocumentUpload = () =>
  useDocumentStore((state) => ({
    isUploading: state.isUploading,
    progress: state.uploadProgress,
    upload: state.uploadDocument,
  }));
