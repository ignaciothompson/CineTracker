import { useCallback, useRef, useState } from 'react';
import type { Category, ViewId } from '../types';

export function useNavigation() {
  const [currentView, setCurrentView] = useState<ViewId>('viendo');
  const [catFilter, setCatFilterState] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQueryState] = useState('');
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
      closeSidebar();
      scrollContentTop();
    },
    [closeSidebar, scrollContentTop],
  );

  const setCatFilter = useCallback(
    (cat: Category | 'all') => {
      setCatFilterState(cat);
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
    catFilter,
    searchQuery,
    sidebarOpen,
    contentScrollRef,
    setView,
    setCatFilter,
    setSearchQuery,
    toggleSidebar,
    closeSidebar,
  };
}
