import type { ListItem, ListRecord, MediaKind } from '../types';

export function listItemRef(kind: MediaKind, record: { id: string; tvtime_uuid?: string }) {
  return {
    uuid: record.tvtime_uuid || record.id,
    type: kind === 'tv' ? ('series' as const) : ('movie' as const),
  };
}

export function isItemInList(
  list: ListRecord,
  kind: MediaKind,
  record: { id: string; tvtime_uuid?: string },
): boolean {
  const ref = listItemRef(kind, record);
  return (list.items || []).some((i) => i.uuid === ref.uuid && i.type === ref.type);
}

export function listsContainingItem(
  lists: ListRecord[],
  kind: MediaKind,
  record: { id: string; tvtime_uuid?: string },
): ListRecord[] {
  return lists.filter((l) => isItemInList(l, kind, record));
}

export function buildListItem(
  kind: MediaKind,
  record: { id: string; title: string; tvtime_uuid?: string },
  custom_order: number,
): ListItem {
  const ref = listItemRef(kind, record);
  return {
    name: record.title,
    type: ref.type,
    uuid: ref.uuid,
    custom_order,
  };
}
