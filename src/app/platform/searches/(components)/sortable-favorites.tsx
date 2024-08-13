import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ScrollableTable = () => {
  // Sample data
  const data = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    col3: `Value 3-${i + 1}`,
    col4: `Value 4-${i + 1}`,
    col5: `Value 5-${i + 1}`,
    col6: `Value 6-${i + 1}`,
    col7: `Value 7-${i + 1}`,
    col8: `Value 8-${i + 1}`,
    col9: `Value 9-${i + 1}`,
    col10: `Value 10-${i + 1}`,
    status: ['Active', 'Inactive', 'Pending'][i % 3],
  }));

  return (
    <div className="w-full overflow-hidden border rounded-lg">
      <div className="flex">
        {/* Fixed left columns */}
        <div className="flex-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead className="w-40">Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Scrollable middle columns */}
        <div className="flex-grow overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {[3, 4, 5, 6, 7, 8, 9, 10].map((colNum) => (
                  <TableHead key={colNum} className="w-40">Column {colNum}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((colNum) => (
                    <TableCell key={colNum}>{row[`col${colNum}`]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Fixed right column */}
        <div className="flex-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ScrollableTable;