import React from 'react';
import BranchesClient from './BranchesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

// تأمين حدود الـ Types لمنع تعارض الـ Props الداخلية للمكون
const SafeBranchesClient = BranchesClient as React.ComponentType<{
  locale?: string;
  [key: string]: any;
}>;

export default async function AdminBranchesPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  return (
    <main className="w-full min-h-screen">
      <SafeBranchesClient locale={locale} />
    </main>
  );
}
