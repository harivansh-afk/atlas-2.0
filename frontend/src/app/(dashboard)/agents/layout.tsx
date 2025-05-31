import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Conversation | Atlas ',
  description: 'Interactive agent conversation powered by Atlas ',
  openGraph: {
    title: 'Agent Conversation | Atlas ',
    description: 'Interactive agent conversation powered by Atlas ',
    type: 'website',
  },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
