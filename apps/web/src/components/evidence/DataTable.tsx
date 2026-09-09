"use client";

import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  emptyMessage = "No rows",
}: {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink/50 font-mono py-4">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto border border-ink/20">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="bg-paper-muted border-b border-ink/20">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 text-xs uppercase tracking-wide text-ink/60 font-display ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-ink/10 last:border-0 hover:bg-paper-muted/50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2 ${col.align === "right" ? "text-right tabular-nums" : "text-left"}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
