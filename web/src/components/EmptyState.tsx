export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="big">{icon}</div>
      <div>{text}</div>
    </div>
  );
}
