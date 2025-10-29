
// No 'use client' here
import SlugPageContent from '@/components/page-content/slug-page-content';
import { Metadata } from 'next';

// This is a dynamic page, so we don't use generateStaticParams with a dynamic fetch model.
// The page will be rendered on-demand on the server.

type Props = {
  params: { slug: string }
}

// Optional: You can generate metadata dynamically if needed
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug;
  // In a real scenario, you might fetch page title based on slug here
  // For now, we'll generate a generic title.
  const title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return {
    title: `${title} | Marhaba Market`,
  };
}

export default function SlugPage({ params }: Props) {
  // This is a Server Component. It fetches nothing.
  // It only passes the slug to the Client Component that does the fetching.
  return <SlugPageContent slug={params.slug} />;
}
