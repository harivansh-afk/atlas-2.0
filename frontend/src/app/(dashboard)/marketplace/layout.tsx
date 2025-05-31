import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Gardens | Atlas',
  description: 'Discover and add powerful AI agents created by the community to your personal library',
  openGraph: {
    title: 'Agent Gardens | Atlas',
    description: 'Discover and add powerful AI agents created by the community to your personal library',
    type: 'website',
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
