interface TableColumn {
  key: string;
  title: string;
}

interface TableRow {
  id: string;
  values: Record<string, string>;
}

interface DataTableProps {
  columns: TableColumn[];
  rows: TableRow[];
}

export function DataTable({ columns, rows }: DataTableProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-kira-warmgray/40">
      <table className="table-zebra min-w-full border-collapse">
        <thead>
          <tr className="bg-kira-darkgray text-left text-kira-offwhite">
            {columns.map((column) => (
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]" key={column.key}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-b border-kira-warmgray/35" key={row.id}>
              {columns.map((column) => (
                <td className="px-4 py-3 text-sm text-kira-black" key={column.key}>
                  {row.values[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="kira-surface-elevated flex items-center justify-between px-4 py-3 text-xs text-kira-darkgray">
        <span>Showing 1-5 of 125</span>
        <div className="flex items-center gap-2">
          <button className="kira-focus-ring rounded border border-kira-warmgray px-2 py-1 hover:bg-kira-warmgray/20" type="button">
            Previous
          </button>
          <button className="kira-focus-ring rounded border border-kira-warmgray px-2 py-1 hover:bg-kira-warmgray/20" type="button">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
