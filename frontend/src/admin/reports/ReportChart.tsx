/** Accessible SVG plots retain every native bucket; keyboard focus reveals the exact bucket value. */
import { useEffect, useId, useRef, useState } from "react";
export type Point = { label: string; value: number | null };
export default function ReportChart({
  points,
  title,
  format,
  view,
}: {
  points: Point[];
  title: string;
  format: (n: number) => string;
  view: "line" | "bar";
}) {
  const id = useId(),
    [active, setActive] = useState<number | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  useEffect(() => {
    const el = frame.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(280, entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const height = 230,
    left = 80,
    top = 18,
    bottom = 35,
    plot = width - left - 18,
    high = height - top - bottom;
  const max = Math.max(1, ...points.map((p) => p.value ?? 0));
  const x = (i: number) =>
    left + (points.length < 2 ? plot / 2 : (i * plot) / (points.length - 1));
  const y = (v: number) => top + high - (v / max) * high;
  const path = points
    .map((p, i) =>
      p.value === null
        ? ""
        : `${i && points[i - 1].value !== null ? "L" : "M"}${x(i)},${y(p.value)}`,
    )
    .join(" ");
  const selected = active === null ? undefined : points[active];
  return (
    <div
      ref={frame}
      className="report-plot"
      onMouseLeave={() => setActive(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id}>
        <title id={id}>{title}</title>
        {[0, 0.5, 1].map((n) => (
          <g key={n}>
            <line
              className="report-gridline"
              x1={left}
              x2={width - 18}
              y1={y(n * max)}
              y2={y(n * max)}
            />
            <text
              className="report-axis"
              x={left - 9}
              y={y(n * max) + 4}
              textAnchor="end"
            >
              {format(n * max)}
            </text>
          </g>
        ))}
        {view === "line" && (
          <path className="report-line" d={path} fill="none" />
        )}
        {points.map((p, i) =>
          p.value === null ? null : (
            <g key={`${p.label}_${i}`}>
              {view === "bar" && (
                <rect
                  className="report-bar"
                  x={x(i) - Math.max(1, Math.min(12, plot / points.length / 3))}
                  y={y(p.value)}
                  width={Math.max(
                    2,
                    Math.min(24, (plot / points.length) * 0.6),
                  )}
                  height={Math.max(0, top + high - y(p.value))}
                />
              )}
              <circle
                className="report-point"
                cx={x(i)}
                cy={y(p.value)}
                r={active === i ? 6 : 4}
                tabIndex={0}
                role="button"
                aria-label={`${p.label}: ${format(p.value)}`}
                onFocus={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setActive(null);
                }}
              />
            </g>
          ),
        )}
        {points
          .filter(
            (_, i) =>
              !i ||
              i === points.length - 1 ||
              (i %
                Math.max(
                  1,
                  Math.ceil(points.length / (width < 500 ? 2 : 5)),
                ) ===
                0 &&
                i <
                  points.length -
                    Math.max(
                      1,
                      Math.ceil(points.length / (width < 500 ? 3 : 7)),
                    )),
          )
          .map((p) => (
            <text
              className="report-axis"
              key={p.label}
              x={x(points.indexOf(p))}
              y={height - 9}
              textAnchor={
                p === points[0]
                  ? "start"
                  : p === points[points.length - 1]
                    ? "end"
                    : "middle"
              }
            >
              {p.label}
            </text>
          ))}
      </svg>
      <output className="report-point-value" aria-live="polite">
        {selected && selected.value !== null
          ? `${selected.label} · ${format(selected.value)}`
          : "\u00a0"}
      </output>
    </div>
  );
}
