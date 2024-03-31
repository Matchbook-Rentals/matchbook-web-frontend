import React from 'react';
import ListIcon from '@/components/ui/list-icon';
import WindowIcon from '@/components/ui/window-icon';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';

const PropertyHeader = () => {
  return (
    <div className='border border-gray-500 rounded-lg my-2 py-2'>
      <div className='flex flex-col lg:flex-row sm:justify-between px-4 sm:px-10 py-2'>
        <div className='flex flex-wrap gap-3 justify-center sm:justify-start'>
          <Tabs>
        <div className="flex space-x-4">
          <Button className="text-2xl font-semibold" variant="ghost">
            All (3)
          </Button>
          <Button className="text-2xl" variant="ghost">
            For rent (1)
          </Button>
          <Button className="text-2xl" variant="ghost">
            Rented (2)
          </Button>
        </div>
      </Tabs>
        </div>
        <div className='flex mt-4 sm:mt-0 justify-center sm:justify-end'>
          <div className='flex rounded-lg border border-slate-600 items-center'>
            <div className='p-1'><ListIcon size={{ height: 35, width: 35 }} /></div>
            <div className='bg-primaryBrand py-1 px-3 rounded-r-lg'><WindowIcon width={22} height={35} /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyHeader;
