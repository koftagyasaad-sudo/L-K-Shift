import React from 'react';
import BranchesClient from '../admin/branches/BranchesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

// عزل الـ Types لتفادي أي أخطاء تجميع في Vercel
const SafeBranchesClient = BranchesClient as React.ComponentType<{
  locale?: string;
  [key: string]: any;
}>;

export default async function BranchesPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  return (
    <main className="w-full">
      <SafeBranchesClient locale={locale} />
    </main>
  );
}
