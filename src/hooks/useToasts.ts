import { useCallback, useEffect, useRef, useState } from "react";

export type ToastTone = "info" | "success" | "warn";

export type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
  /** When present the toast shows an Undo button and stays on screen longer. */
  undo?: () => void;
};

export type NotifyOptions = { tone?: ToastTone; undo?: () => void };

/**
 * Small toast queue with support for reversible actions.
 *
 * Destructive operations pass an `undo` callback instead of blocking behind a
 * confirm dialog, which keeps the app fast without making deletions final.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, options: NotifyOptions = {}) => {
      const id = nextId.current++;
      const toast: Toast = { id, message, tone: options.tone ?? "info", undo: options.undo };
      setToasts((current) => [...current.slice(-2), toast]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), options.undo ? 7000 : 3200),
      );
      return id;
    },
    [dismiss],
  );

  const runUndo = useCallback(
    (id: number) => {
      setToasts((current) => {
        current.find((toast) => toast.id === id)?.undo?.();
        return current.filter((toast) => toast.id !== id);
      });
      const timer = timers.current.get(id);
      if (timer) clearTimeout(timer);
      timers.current.delete(id);
    },
    [],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  return { toasts, notify, dismiss, runUndo };
}
