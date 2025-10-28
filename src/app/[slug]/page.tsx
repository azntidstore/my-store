import SlugPageContent from '@/components/page-content/slug-page-content';

export function generateStaticParams() {
  // We return an empty array because we want all slugs to be generated on-demand on the client.
  // This satisfies the `output: 'export'` build requirement without pre-building any pages.
  return [];
}

export default function SlugPage({ params }: { params: { slug: string } }) {
  return <SlugPageContent slug={params.slug} />;
}
