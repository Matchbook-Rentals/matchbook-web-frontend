import React from 'react';
// Assuming ListIcon and WindowIcon are your custom components
// If they come from a library, adjust the import statement accordingly
import ListIcon from '@/components/ui/list-icon'
import PlusIcon from '@/components/ui/plus-icon'
import WindowIcon from '@/components/ui/window-icon'

const PropertyHeader = () => {
  return (
    <div className='role:propertyCounter border-2 border-black rounded-lg my-2 py-2'>
      <div className='flex ml-10 justify-between mr-10'>
        <div className='flex gap-3'>
          <p className='font-semibold text-2xl'>All (m)</p>
          <p className='font-semibold text-2xl'>For rent (m)</p>
          <p className='font-semibold text-2xl'>Rented (m)</p>
        </div>
        <div className='flex rounded-lg border border-slate-600'>
          <div className='p-1'><ListIcon size={{ height: 35, width: 35 }} borderRight /></div>
          <div className='bg-primaryBrand py-1 px-3 rounded-r-lg'><WindowIcon width={22} height={35} /></div>
        </div>
      </div>
    </div>
  );
};

export default PropertyHeader;
