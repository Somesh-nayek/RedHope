import type { Metadata } from 'next';
import './globals.css';
import { RootLayoutClient } from './root-layout-client';

export const metadata: Metadata = {
  title: 'Red Hope',
  description: 'Blood donation and hospital coordination platform'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
