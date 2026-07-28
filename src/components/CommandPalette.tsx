import { useEffect, useMemo, useRef, useState } from "react";
import { useDialog } from "./charts";

export type Command = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  /** Extra words matched by the search, never displayed. */
  keywords?: string;
  run: () => void;
};

/**
 * Ctrl/⌘-K launcher.
 *
 * Everything reachable through the sidebar, the catalogues and the common
 * actions is available from one keystroke, which keeps the app fast to drive
 * once the routine is set up.
 */
export function CommandPalette({
  open,
  commands,
  onClose,
}: {
  open: boolean;
  commands: Command[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const dialogRef = useDialog(open, onClose);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands.slice(0, 12);
    return commands
      .map((command) => {
        const haystack = `${command.label} ${command.group} ${command.keywords ?? ""}`.toLowerCase();
        const index = haystack.indexOf(needle);
        return { command, index };
      })
      .filter((entry) => entry.index >= 0)
      .sort((a, b) => a.index - b.index)
      .slice(0, 20)
      .map((entry) => entry.command);
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
    }
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({
      block: "nearest",
    });
  }, [cursor, results]);

  if (!open) return null;

  const run = (command: Command) => {
    onClose();
    command.run();
  };

  return (
    <div className="palette-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette" ref={dialogRef}>
        <div className="palette-input">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Jump to a tab, exercise, food or action…"
            aria-label="Search commands"
            aria-controls="palette-results"
            aria-activedescendant={results[cursor] ? `palette-${results[cursor].id}` : undefined}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setCursor((index) => Math.min(index + 1, results.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setCursor((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter" && results[cursor]) {
                event.preventDefault();
                run(results[cursor]);
              }
            }}
          />
          <kbd>ESC</kbd>
        </div>

        <ul className="palette-results" id="palette-results" role="listbox" ref={listRef}>
          {results.map((command, index) => (
            <li key={command.id}>
              <button
                type="button"
                id={`palette-${command.id}`}
                role="option"
                aria-selected={index === cursor}
                className={index === cursor ? "active" : ""}
                onMouseEnter={() => setCursor(index)}
                onClick={() => run(command)}
              >
                <span className="palette-group">{command.group}</span>
                <b>{command.label}</b>
                {command.hint && <small>{command.hint}</small>}
              </button>
            </li>
          ))}
          {!results.length && (
            <li className="palette-empty">Nothing matches “{query}”.</li>
          )}
        </ul>

        <footer className="palette-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> run
          </span>
          <span>
            <kbd>Ctrl</kbd>
            <kbd>K</kbd> toggle
          </span>
        </footer>
      </div>
    </div>
  );
}
