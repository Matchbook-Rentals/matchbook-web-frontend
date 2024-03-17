'use client';
import { TripContext } from '@/contexts/trip-context-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext } from 'react';

const SidebarLink = ({ link, currPath, setHeaderText }) => {
  // const isActive = router.pathname === link.path;
  const isActive = currPath === link.path;

  return (
    <Link onClick={() => {setHeaderText(link.headerText)}} href={link.path} passHref>
      <p className={isActive ? 'font-bold' : ''} style={{ cursor: 'pointer' }}>
        {link.displayText}
      </p>
    </Link>
  );
};

const Sidebar = ({ links }) => {
  const currPath = usePathname();
  const { setHeaderText } = useContext(TripContext);

  return (
    <div className='sidebar w-1/8 h-1/6 border-slate-400 border-2 px-4 text-xl py-2 rounded-2xl flex flex-col'>
      <div className='flex flex-col gap-y-2'>
        {links.map((link, index) => (
          <SidebarLink key={index} link={link} currPath={currPath} setHeaderText={setHeaderText} />
        ))}
      </div>
      <div className='mt-10'>
        <Link href="/platform/dashboard" passHref>
          <p style={{ cursor: 'pointer' }}>Dashboard</p>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar