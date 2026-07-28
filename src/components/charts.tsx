import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/**
 * Chart primitives.
 *
 * Colours come from the `--viz-*` tokens in `styles/tokens.css`, which were
 * validated for colour-vision separation and surface contrast in both themes.
 * Marks follow one spec everywhere: thin columns capped at 24px, a 4px rounded
 * data-end square to the baseline, hairline solid gridlines, and labels only on
 * the points worth calling out. Every chart also exposes its numbers as a table
 * so no value is reachable only by hovering.
 */

/** Observes an element's width so SVG text never scales with the viewBox. */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    setWidth(node.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      setWidth((current) => (Math.abs(current - next) > 0.5 ? next : current));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

export const compact = (value: number) =>
  Math.abs(value) >= 10_000
    ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`
    : Math.round(value).toLocaleString();

/** Clean axis ticks: 0, one mid step, and a rounded ceiling. */
function axisTicks(max: number) {
  if (max <= 0) return [0, 1];
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => max / s <= 4) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 0.001; value += step) ticks.push(Math.round(value));
  return ticks.length > 1 ? ticks : [0, Math.ceil(max)];
}

export type BarDatum = {
  key: string;
  label: string;
  value: number;
  /** Optional second line under the axis label. */
  sub?: string;
};

type BarChartProps = {
  data: BarDatum[];
  unit?: string;
  height?: number;
  /** Highlights one bar; clicking a bar calls `onSelect` with its key. */
  selectedKey?: string;
  onSelect?: (key: string) => void;
  /** Accessible description of what the chart plots. */
  caption: string;
  emptyMessage?: string;
};

export function BarChart({
  data,
  unit = "",
  height = 210,
  selectedKey,
  onSelect,
  caption,
  emptyMessage = "No data yet.",
}: BarChartProps) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  const max = Math.max(...data.map((d) => d.value), 0);
  const ticks = axisTicks(max);
  const ceiling = ticks[ticks.length - 1] || 1;
  const hasData = data.some((d) => d.value > 0);

  const padding = { top: 22, right: 8, bottom: 30, left: 44 };
  const plotWidth = Math.max(0, width - padding.left - padding.right);
  const plotHeight = height - padding.top - padding.bottom;
  const band = data.length ? plotWidth / data.length : 0;
  // 2px of surface between neighbours does the separating — never a stroke.
  const barWidth = Math.max(4, Math.min(24, band - 8));
  const peakKey = data.reduce((best, d) => (d.value > (best?.value ?? -1) ? d : best), data[0])?.key;
  const active = hovered ?? selectedKey ?? null;
  const activeDatum = data.find((d) => d.key === active);

  return (
    <figure className="viz" ref={wrapRef}>
      <div className="viz-plot" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={caption}>
            {ticks.map((tick) => {
              const y = padding.top + plotHeight - (tick / ceiling) * plotHeight;
              return (
                <g key={tick}>
                  <line
                    className="viz-grid"
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y}
                    y2={y}
                  />
                  <text className="viz-tick" x={padding.left - 8} y={y + 3} textAnchor="end">
                    {compact(tick)}
                  </text>
                </g>
              );
            })}

            {data.map((datum, index) => {
              const barHeight = ceiling ? (datum.value / ceiling) * plotHeight : 0;
              const x = padding.left + index * band + (band - barWidth) / 2;
              const y = padding.top + plotHeight - barHeight;
              const isActive = datum.key === active;
              const label = datum.key === peakKey || datum.key === selectedKey;
              return (
                <g key={datum.key}>
                  {barHeight > 0 && (
                    <path
                      className={`viz-bar${isActive ? " is-active" : ""}`}
                      d={roundedTopBar(x, y, barWidth, barHeight)}
                    />
                  )}
                  {label && datum.value > 0 && (
                    <text className="viz-value" x={x + barWidth / 2} y={y - 7} textAnchor="middle">
                      {compact(datum.value)}
                    </text>
                  )}
                  <text
                    className={`viz-tick${isActive ? " is-active" : ""}`}
                    x={x + barWidth / 2}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                  >
                    {datum.label}
                  </text>
                  {/* Full-band hit target so a 4px bar is still easy to reach. */}
                  <rect
                    className="viz-hit"
                    x={padding.left + index * band}
                    y={padding.top}
                    width={band}
                    height={plotHeight}
                    tabIndex={onSelect ? 0 : -1}
                    role={onSelect ? "button" : undefined}
                    aria-label={`${datum.label}: ${Math.round(datum.value).toLocaleString()} ${unit}`.trim()}
                    onMouseEnter={() => setHovered(datum.key)}
                    onMouseLeave={() => setHovered((current) => (current === datum.key ? null : current))}
                    onFocus={() => setHovered(datum.key)}
                    onBlur={() => setHovered((current) => (current === datum.key ? null : current))}
                    onClick={() => onSelect?.(datum.key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect?.(datum.key);
                      }
                    }}
                  />
                </g>
              );
            })}
            <line
              className="viz-axis"
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + plotHeight}
              y2={padding.top + plotHeight}
            />
          </svg>
        )}

        {activeDatum && (
          <div className="viz-tooltip" role="status">
            <b>{activeDatum.label}</b>
            <span>
              {Math.round(activeDatum.value).toLocaleString()} {unit}
            </span>
            {activeDatum.sub && <small>{activeDatum.sub}</small>}
          </div>
        )}

        {!hasData && <p className="viz-empty">{emptyMessage}</p>}
      </div>

      <figcaption className="viz-caption">
        <span>{caption}</span>
        <button
          type="button"
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => setShowTable((open) => !open)}
        >
          {showTable ? "Hide table" : "View as table"}
        </button>
      </figcaption>

      {showTable && (
        <table className="viz-table" id={tableId}>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">{unit || "Value"}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((datum) => (
              <tr key={datum.key}>
                <th scope="row">{datum.sub ?? datum.label}</th>
                <td>{Math.round(datum.value).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}

/** Square at the baseline, 4px rounded at the data end. */
function roundedTopBar(x: number, y: number, width: number, height: number) {
  const radius = Math.min(4, width / 2, height);
  return [
    `M${x},${y + height}`,
    `V${y + radius}`,
    `a${radius},${radius} 0 0 1 ${radius},${-radius}`,
    `h${width - radius * 2}`,
    `a${radius},${radius} 0 0 1 ${radius},${radius}`,
    `V${y + height}`,
    "Z",
  ].join(" ");
}

type SparklineProps = {
  values: number[];
  label: string;
  height?: number;
};

/** 2px trend line in the de-emphasis hue with the latest point in the accent. */
export function Sparkline({ values, label, height = 42 }: SparklineProps) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  if (!values.length) {
    return (
      <div className="sparkline is-empty" ref={wrapRef}>
        <span>No history yet</span>
      </div>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const inset = 5;
  const usable = Math.max(1, width - inset * 2);
  const points = values.map((value, index) => ({
    x: inset + (values.length === 1 ? usable / 2 : (index / (values.length - 1)) * usable),
    y: inset + (1 - (value - min) / span) * (height - inset * 2),
  }));
  const path = points.map((point, i) => `${i ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <div className="sparkline" ref={wrapRef}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${label}: ${values.length} points, latest ${values[values.length - 1].toLocaleString()}`}
        >
          <path className="sparkline-line" d={path} />
          <circle className="sparkline-dot" cx={last.x} cy={last.y} r={4} />
        </svg>
      )}
    </div>
  );
}

export type MeterStatus = "none" | "under" | "in-range" | "over" | "good";

type MeterProps = {
  value: number;
  max: number;
  status?: MeterStatus;
  /** Optional marker showing where the healthy range begins. */
  threshold?: number;
  label: string;
};

/** Track is a lighter step of the fill's own ramp so state reads across the bar. */
export function Meter({ value, max, status = "good", threshold, label }: MeterProps) {
  const fill = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  return (
    <div
      className={`meter status-${status}`}
      role="meter"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-label={label}
    >
      <i style={{ width: `${fill * 100}%` }} />
      {threshold !== undefined && max > 0 && threshold < max && (
        <span className="meter-threshold" style={{ left: `${(threshold / max) * 100}%` }} aria-hidden="true" />
      )}
    </div>
  );
}

type StatTileProps = {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  /** Set false when a rising number is a bad thing. */
  upIsGood?: boolean;
  trend?: number[];
  footnote?: string;
  selected?: boolean;
  onClick?: () => void;
};

export function StatTile({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  upIsGood = true,
  trend,
  footnote,
  selected,
  onClick,
}: StatTileProps) {
  const direction = delta === undefined || delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const good = direction === "flat" ? null : (direction === "up") === upIsGood;
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      className={`stat-tile${selected ? " selected" : ""}`}
      {...(onClick ? { type: "button" as const, onClick, "aria-pressed": Boolean(selected) } : {})}
    >
      <div className="stat-tile-top">
        <span className="eyebrow">{label}</span>
        {delta !== undefined && (
          <b className={`delta delta-${direction}${good === null ? "" : good ? " is-good" : " is-bad"}`}>
            <span aria-hidden="true">{direction === "up" ? "▲" : direction === "down" ? "▼" : "—"}</span>
            {direction === "flat" ? "no change" : `${Math.abs(delta)}%`}
            {deltaLabel && <small> {deltaLabel}</small>}
          </b>
        )}
      </div>
      <strong className="stat-tile-value">
        {value}
        {unit && <small>{unit}</small>}
      </strong>
      {trend && trend.length > 1 && <Sparkline values={trend} label={label} />}
      {footnote && <span className="stat-tile-foot">{footnote}</span>}
    </Wrapper>
  );
}

/** Circular progress gauge used for the one hero figure on the dashboard. */
export function ProgressRing({
  value,
  total,
  size = 118,
}: {
  value: number;
  total: number;
  size?: number;
}) {
  const ratio = total > 0 ? Math.min(1, value / total) : 0;
  const stroke = Math.max(8, size * 0.1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-label">
        {value}
        <small>
          OF {total}
          <br />
          MOVES
        </small>
      </span>
    </div>
  );
}

/** Escape-to-close plus focus trapping, shared by every dialog in the app. */
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !ref.current) return;
      const focusable = ref.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", handleKey);
    const frame = requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLElement>("input,button,select,textarea")?.focus();
    });
    return () => {
      document.removeEventListener("keydown", handleKey);
      cancelAnimationFrame(frame);
      previous?.focus?.();
    };
  }, [open, handleKey]);

  return ref;
}
