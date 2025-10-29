
// No 'use client' here
import CategoryPageContent from '@/components/page-content/category-page-content';
import { Metadata } from 'next';

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug;
  const title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return {
    title: `Category: ${title} | Marhaba Market`,
  };
}

export default function CategoryPage({ params }: Props) {
  // This is a Server Component. It only passes the slug to the Client Component.
  return <CategoryPageContent slug={params.slug} />;
}
