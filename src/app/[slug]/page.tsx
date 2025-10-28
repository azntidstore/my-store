
import SlugPageContent from '@/components/page-content/slug-page-content';

// This function is required for dynamic routes with `output: 'export'`.
// It tells Next.js not to pre-render any pages at build time.
export function generateStaticParams() {
  return [];
}

// This is a server component. It gets params from the URL.
export default function SlugPage({ params }: { params: { slug: string } }) {
  // It renders the client component and passes the slug down as a prop.
  return <SlugPageContent slug={params.slug} />;
}
