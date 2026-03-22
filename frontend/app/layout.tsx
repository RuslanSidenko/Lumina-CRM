import './globals.css';

export const metadata = {
  title: 'Lumina | Minimalistic Real Estate CRM',
  description: 'Fast, modern, and beautiful real estate CRM.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
