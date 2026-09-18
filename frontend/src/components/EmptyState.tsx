interface Props {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <div className="empty" role="status">
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn-primary" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}
