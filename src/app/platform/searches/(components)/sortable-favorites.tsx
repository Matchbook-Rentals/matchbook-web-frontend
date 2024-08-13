import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const ScrollableTable = () => {
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    col3: true,
    col4: true,
    col5: true,
    col6: true,
    col7: true,
    col8: true,
    col9: true,
    col10: true,
    status: true,
  });

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

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const scrollableColumns = ['col3', 'col4', 'col5', 'col6', 'col7', 'col8', 'col9', 'col10'];

  return (
    <div className="w-full  max-h-[400px] overflow-scroll border rounded-lg">
      <div className="flex">
        {/* Fixed left columns */}
        <div className="flex-none">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.id && <TableHead className="w-20 h-20 text-bold text-gray-400">ID</TableHead>}
                {visibleColumns.name && <TableHead className="w-40 h-20 text-bold text-gray-400">Name</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  {visibleColumns.id && <TableCell className='h-20 w-20'>{row.id}</TableCell>}
                  {visibleColumns.name && <TableCell className='h-20 w-20'>{row.name}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Scrollable middle columns */}
        <div className=" overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {scrollableColumns.map((col) => (
                  visibleColumns[col] && <TableHead key={col} className="w-20 h-20 text-bold text-gray-400">Column {col.slice(3)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  {scrollableColumns.map((col) => (
                    visibleColumns[col] && <TableCell key={col} className='h-20 w-20'>{row[col]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Fixed right column with Popover */}
        <div className="flex-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40 h-20 text-bold text-gray-400">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full">Edit Columns</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid grid-cols-2 gap-4">
                        {Object.keys(visibleColumns).map((column) => (
                          <div key={column} className="flex items-center space-x-2">
                            <Checkbox
                              id={column}
                              checked={visibleColumns[column]}
                              onCheckedChange={() => toggleColumn(column)}
                            />
                            <label
                              htmlFor={column}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {column === 'id' ? 'ID' :
                                column === 'name' ? 'Name' :
                                  column === 'status' ? 'Status' :
                                    `Column ${column.slice(3)}`}
                            </label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow className=' flex justify-center items-center' key={row.id}>
                  {visibleColumns.status && <TableCell className='h-20 w-20 flex justify-center items-center '><Button >Apply</Button></TableCell>}
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