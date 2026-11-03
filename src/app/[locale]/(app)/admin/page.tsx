import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AdminRootRedirect({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  redirect(`/${locale}/admin/dashboard`);
}
