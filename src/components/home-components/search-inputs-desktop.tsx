'use client';

import React, { useState } from "react";
import DesktopSearchTrigger from "./DesktopSearchTrigger";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SearchInputsDesktopProps {
  hasAccess: boolean;
  className?: string;
  inputClassName?: string;
  searchButtonClassNames?: string;
  searchIconColor?: string;
  popoverMaxWidth?: string;
  headerText?: string;
  headerClassName?: string;
}

const SearchInputsDesktop: React.FC<SearchInputsDesktopProps> = (props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <DesktopSearchTrigger
        {...props}
        containerStyles={props.className}
        inputStyles={props.inputClassName}
        onOpenDialog={() => setIsDialogOpen(true)}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Search</h2>
            <p>Search functionality coming soon...</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SearchInputsDesktop;