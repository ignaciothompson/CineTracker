import { useCallback, useRef, useState } from 'react';
import type { MediaTab, ViewId } from '../types';

export function useNavigation() {
  const [currentView, setCurrentView] = useState<ViewId>('viendo');
  const [mediaTab, setMediaTabState] = useState<MediaTab>('todo');
  const [genreFilter, setGenreFilterState] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const scrollContentTop = useCallback(() => {
    contentScrollRef.current?.scrollTo(0, 0);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    document.body.style.overflow = '';
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => {
      const next = !open;
      document.body.style.overflow = next ? 'hidden' : '';
      return next;
    });
  }, []);

  const setView = useCallback(
    (view: ViewId) => {
      setCurrentView(view);
      setSearchQueryState('');
      setGenreFilterState([]);
      closeSidebar();
      scrollContentTop();
    },
    [closeSidebar, scrollContentTop],
  );

  const setMediaTab = useCallback(
    (tab: MediaTab) => {
      setMediaTabState(tab);
      scrollContentTop();
    },
    [scrollContentTop],
  );

  const setGenreFilter = useCallback(
    (genres: string[]) => {
      setGenreFilterState(genres);
      scrollContentTop();
    },
    [scrollContentTop],
  );

  const toggleGenreFilter = useCallback(
    (name: string) => {
      setGenreFilterState((prev) =>
        prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name],
      );
      scrollContentTop();
    },
    [scrollContentTop],
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);
      scrollContentTop();
    },
    [scrollContentTop],
  );

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
