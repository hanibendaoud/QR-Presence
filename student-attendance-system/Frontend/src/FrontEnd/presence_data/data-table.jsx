import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DataTable({ columns, data,sg }) {
  return (
    <div className="space-y-3 text-sm">
      {(!sg && data.length === 0) ? (
        <div className="text-center text-gray-500 py-2 text-xs">
          Please select a group first.
        </div>
      ) : (sg && data.length === 0) ? (
        <div className="text-center text-gray-500 py-2 text-xs">
          no students found
        </div>
      ):(
        <>
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.accessorKey || col.id} className="px-2 py-1">
                    {typeof col.header === 'function' 
                      ? col.header({ column: { getIsSorted: () => {} } }) 
                      : col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={col.accessorKey || col.id} className="px-2 py-1">
                      {col.cell 
                        ? col.cell({ row: { original: row, getValue: (key) => row[key] } }) 
                        : row[col.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}