import Link from 'next/link';
import React from 'react';

export interface BreadcrumbLink {
  label: string;
  url?: string;
}

interface BreadcrumbsProps {
  links: BreadcrumbLink[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ links, className = '' }) => {
  return (
    <nav className={`text-[#404040] text-[14px] leading-normal ${className}`}>
      {links.map((link, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="mx-2">&gt;</span>}
          {link.url ? (
            <Link
              href={link.url}
              className="cursor-pointer hover:underline"
            >
              {link.label}
            </Link>
          ) : (
            <span className="cursor-default">{link.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;