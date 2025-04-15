import { redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import React from 'react';

export default async function TestLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkRole('admin');
  if (!isAdmin) {
    redirect('/unauthorized');
  }
  return <>{children}</>;
}
