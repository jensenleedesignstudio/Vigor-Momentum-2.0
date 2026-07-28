import type { Toast } from "../hooks/useToasts";

/**
 * Live region for transient feedback. Reversible actions surface an Undo button
 * here rather than behind a blocking confirm dialog.
 */
export function Toasts({
  toasts,
  onUndo,
  onDismiss,
}: {
  toasts: Toast[];
  onUndo: (id: number) => void;
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div className={`toast tone-${toast.tone}`} key={toast.id}>
          <span>{toast.message}</span>
          {toast.undo && (
            <button type="button" className="toast-undo" onClick={() => onUndo(toast.id)}>
              Undo
            </button>
          )}
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
