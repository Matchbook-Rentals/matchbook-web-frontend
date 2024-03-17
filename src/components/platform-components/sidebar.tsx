'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SidebarLink = ({ link, currPath}) => {
  // const isActive = router.pathname === link.path;
  const isActive = currPath === link.path;

  return (
    <Link href={link.path} passHref>
      <p className={isActive ? 'font-bold' : ''} style={{ cursor: 'pointer' }}>
        {link.displayText}
      </p>
    </Link>
  );
};

const Sidebar = ({ links }) => {
  const currPath = usePathname();
  return (
    <div className='sidebar w-1/8 h-1/6 border-slate-400 border-2 px-4 text-xl py-2 rounded-2xl flex flex-col'>
      <div className='flex flex-col gap-y-2'>
        {links.map((link, index) => (
          <SidebarLink key={index} link={link} currPath={currPath} />
        ))}
      </div>
      <div className='mt-10'>
        <Link href="/dashboard" passHref>
          <p style={{ cursor: 'pointer' }}>Dashboard</p>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar