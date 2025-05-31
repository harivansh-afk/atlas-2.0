import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Agent | Atlas',
  description: 'Interactive agent playground powered by Atlas',
  openGraph: {
    title: 'Agent Playground | Atlas',
    description: 'Interactive agent playground powered by Atlas',
    type: 'website',
  },
};

export default function NewAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
