import { useEffect } from 'react';
import { useDetailContext, useLibraryContext } from '../context/AppContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { DetailContent } from './DetailContent';
import { DetailScreen } from './DetailScreen';
import './DetailModal.css';

export function DetailView() {
  const isMobile = useIsMobile();
  const {
    detail,
    closeDetail,
    getDetailItem,
    updateField,
    toggleEpisode,
    toggleSeasonWatch,
    deleteItem,
  } = useDetailContext();
  const { lists, addToList, removeFromList } = useLibraryContext();

  const item = detail ? getDetailItem() : undefined;

  useEffect(() => {
    if (detail && !item) closeDetail();
  }, [detail, item, closeDetail]);

  useEffect(() => {
    if (!detail || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detail, isMobile]);

  if (!detail || !item) return null;

  const kind = detail.kind;
  const listRecord = { id: item.id, title: item.title, tvtime_uuid: item.tvtime_uuid };

  const contentProps = {
    item,
    kind,
    lists,
    onClose: closeDetail,
    onUpdateField: (field: string, value: unknown) =>
      void updateField(kind, item.id, field, value),
    onToggleEpisode: (seasonNum: number, epNum: number) =>
      void toggleEpisode(item.id, seasonNum, epNum),
    onToggleSeasonWatch: (seasonNum: number) => void toggleSeasonWatch(item.id, seasonNum),
    onDelete: () => void deleteItem(kind, item.id),
    onAddToList: (listId: string) => addToList(listId, kind, listRecord),
    onRemoveFromList: (listId: string) => void removeFromList(listId, kind, listRecord),
  };

  if (isMobile) {
    return <DetailScreen key={`${kind}-${item.id}`} {...contentProps} />;
  }

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && closeDetail()}>
      <div className="modal">
        <div style={{ position: 'relative' }}>
          <DetailContent key={`${kind}-${item.id}`} {...contentProps} variant="modal" />
        </div>
      </div>
    </div>
  );
}
