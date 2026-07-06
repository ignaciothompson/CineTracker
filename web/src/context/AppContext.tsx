import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { useDetailModal } from '../hooks/useDetailModal';
import { useLibrary } from '../hooks/useLibrary';
import { useNavigation } from '../hooks/useNavigation';
import { useTmdbSettings } from '../hooks/useTmdbSettings';
import { countByStatus } from '../lib/library';
import type { ClaudeModelId } from '../lib/claudeModels';
import type {
  DetailTarget,
  LibraryItem,
  ListRecord,
  MediaTab,
  MovieRecord,
  SeriesRecord,
  ViewId,
} from '../types';

interface AppContextValue {
  loading: boolean;
  series: SeriesRecord[];
  movies: MovieRecord[];
  lists: ListRecord[];
  library: LibraryItem[];
  counts: ReturnType<typeof countByStatus>;
  tmdbKey: string | null;
  anthropicReady: boolean;
  anthropicModel: ClaudeModelId;
  settingsReady: boolean;
  currentView: ViewId;
  mediaTab: MediaTab;
  genreFilter: string[];
  searchQuery: string;
  sidebarOpen: boolean;
  detail: DetailTarget | null;
  setView: (view: ViewId) => void;
  setMediaTab: (tab: MediaTab) => void;
  setGenreFilter: (genres: string[]) => void;
  toggleGenreFilter: (name: string) => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openDetail: (kind: LibraryItem['kind'], id: string) => void;
  closeDetail: () => void;
  saveApiKey: (key: string) => Promise<void>;
  saveAnthropicModel: (model: ClaudeModelId) => Promise<void>;
  promptApiKey: () => void;
  reloadLibrary: () => Promise<void>;
  addFromTmdb: (tmdbId: number, type: 'tv' | 'movie') => Promise<void>;
  updateField: (
    kind: LibraryItem['kind'],
    id: string,
    field: string,
    value: unknown,
  ) => Promise<void>;
  toggleEpisode: (id: string, seasonNum: number, epNum: number) => Promise<void>;
  toggleSeasonWatch: (id: string, seasonNum: number) => Promise<void>;
  deleteItem: (kind: LibraryItem['kind'], id: string) => Promise<void>;
  createList: (name: string, description?: string) => Promise<boolean>;
  deleteList: (id: string) => Promise<void>;
  addToList: (
    listId: string,
    kind: LibraryItem['kind'],
    record: { id: string; title: string; tvtime_uuid?: string },
  ) => Promise<boolean>;
  removeFromList: (
    listId: string,
    kind: LibraryItem['kind'],
    record: { id: string; title: string; tvtime_uuid?: string },
  ) => Promise<boolean>;
  getDetailItem: () => SeriesRecord | MovieRecord | undefined;
  contentScrollRef: React.RefObject<HTMLDivElement | null>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const settings = useTmdbSettings();
  const libraryState = useLibrary(settings.tmdbKey);
  const navigation = useNavigation();
  const detailState = useDetailModal(libraryState.series, libraryState.movies);

  const loading = !settings.ready || libraryState.loading;

  const deleteItem: AppContextValue['deleteItem'] = async (kind, id) => {
    if (detailState.detail?.kind === kind && detailState.detail.id === id) {
      detailState.closeDetail();
    }
    await libraryState.deleteItem(kind, id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigation.closeSidebar();
        detailState.closeDetail();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigation.closeSidebar, detailState.closeDetail]);

  const value: AppContextValue = {
    loading,
    series: libraryState.series,
    movies: libraryState.movies,
    lists: libraryState.lists,
    library: libraryState.library,
    counts: libraryState.counts,
    tmdbKey: settings.tmdbKey,
    anthropicReady: settings.anthropicReady,
    anthropicModel: settings.anthropicModel,
    settingsReady: settings.ready,
    currentView: navigation.currentView,
    mediaTab: navigation.mediaTab,
    genreFilter: navigation.genreFilter,
    searchQuery: navigation.searchQuery,
    sidebarOpen: navigation.sidebarOpen,
    detail: detailState.detail,
    setView: navigation.setView,
    setMediaTab: navigation.setMediaTab,
    setGenreFilter: navigation.setGenreFilter,
    toggleGenreFilter: navigation.toggleGenreFilter,
    setSearchQuery: navigation.setSearchQuery,
    toggleSidebar: navigation.toggleSidebar,
    closeSidebar: navigation.closeSidebar,
    openDetail: detailState.openDetail,
    closeDetail: detailState.closeDetail,
    saveApiKey: settings.saveApiKey,
    saveAnthropicModel: settings.saveAnthropicModel,
    promptApiKey: settings.promptApiKey,
    reloadLibrary: libraryState.reloadLibrary,
    addFromTmdb: libraryState.addFromTmdb,
    updateField: libraryState.updateField,
    toggleEpisode: libraryState.toggleEpisode,
    toggleSeasonWatch: libraryState.toggleSeasonWatch,
    deleteItem,
    createList: libraryState.createList,
    deleteList: libraryState.deleteList,
    addToList: libraryState.addToList,
    removeFromList: libraryState.removeFromList,
    getDetailItem: detailState.getDetailItem,
    contentScrollRef: navigation.contentScrollRef,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Focused hooks for components that only need a slice
export function useLibraryContext() {
  const {
    loading,
    series,
    movies,
    lists,
    library,
    counts,
    reloadLibrary,
    addFromTmdb,
    updateField,
    toggleEpisode,
    toggleSeasonWatch,
    deleteItem,
    createList,
    deleteList,
    addToList,
    removeFromList,
  } = useApp();
  return {
    loading,
    series,
    movies,
    lists,
    library,
    counts,
    reloadLibrary,
    addFromTmdb,
    updateField,
    toggleEpisode,
    toggleSeasonWatch,
    deleteItem,
    createList,
    deleteList,
    addToList,
    removeFromList,
  };
}

export function useNavigationContext() {
  const {
    currentView,
    mediaTab,
    genreFilter,
    searchQuery,
    sidebarOpen,
    contentScrollRef,
    setView,
    setMediaTab,
    setGenreFilter,
    toggleGenreFilter,
    setSearchQuery,
    toggleSidebar,
    closeSidebar,
  } = useApp();
  return {
    currentView,
    mediaTab,
    genreFilter,
    searchQuery,
    sidebarOpen,
    contentScrollRef,
    setView,
    setMediaTab,
    setGenreFilter,
    toggleGenreFilter,
    setSearchQuery,
    toggleSidebar,
    closeSidebar,
  };
}

export function useTmdbContext() {
  const {
    tmdbKey,
    anthropicReady,
    anthropicModel,
    settingsReady,
    saveApiKey,
    saveAnthropicModel,
    promptApiKey,
    addFromTmdb,
  } = useApp();
  return {
    tmdbKey,
    anthropicReady,
    anthropicModel,
    settingsReady,
    saveApiKey,
    saveAnthropicModel,
    promptApiKey,
    addFromTmdb,
  };
}

export function useDetailContext() {
  const {
    detail,
    openDetail,
    closeDetail,
    getDetailItem,
    updateField,
    toggleEpisode,
    toggleSeasonWatch,
    deleteItem,
  } = useApp();
  return {
    detail,
    openDetail,
    closeDetail,
    getDetailItem,
    updateField,
    toggleEpisode,
    toggleSeasonWatch,
    deleteItem,
  };
}
