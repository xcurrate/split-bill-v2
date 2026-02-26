import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Split Bill MVP",
  description: "Mobile-first split bill application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-gray-100 text-gray-900 antialiased">
        <main className="max-w-md mx-auto min-h-screen bg-white shadow-lg overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
