import React from "react";
import { useMobile } from "@/components/hooks/useMobile";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

/**
 * ResponsiveTable: Automatically switches between table view (desktop)
 * and card view (mobile) based on screen size
 */
export default function ResponsiveTable({ columns, data, renderMobileCard, className = "" }) {
  const isMobile = useMobile();

  if (isMobile && renderMobileCard) {
    return (
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
            {renderMobileCard(item)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 overflow-hidden">
      <Table className={className}>
        <TableHeader className="bg-gray-50">
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className="text-xs font-semibold text-gray-600">
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={col.key} className="text-sm">
                  {col.render ? col.render(item) : item[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}