
import CategoryPageContent from '@/components/page-content/category-page-content';

// This function is required for dynamic routes with `output: 'export'`.
// It tells Next.js not to pre-render any pages at build time.
export function generateStaticParams() {
  return [];
}

// This is a server component. It gets params from the URL.
export default function CategoryPage({ params }: { params: { slug: string } }) {
  // It renders the client component and passes the slug down as a prop.
  return <CategoryPageContent slug={params.slug} />;
}
