import './global.css';
import { Providers } from './providers';

export const metadata = {
  title: 'AskHub AI — Enterprise Knowledge Assistant',
  description: 'Self-hosted AI knowledge assistant powered by local LLMs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
