import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Poppins, Cutive } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });
const cutive = Cutive({ 
  weight: [ '400'],
  subsets: ["latin"],
  variable: '--font-cutive'
});
const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ["latin"],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: "Matchbook Rentals",
  description: "Flexible Rentals",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

const localization={
  signIn: {
    start: {
      title: 'Welcome to MatchBook',
      subtitle: 'Find a place you love'
    }
  },
  signUp: {
    start: {
      title: 'Welcome to MatchBook',
      subtitle: 'Find a place you love'
    }
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      localization={localization}
      appearance={{
        layout: {logoImageUrl: '/new-green-logo.png', socialButtonsPlacement: 'bottom', socialButtonsVariant: 'blockButton'}}
    }>
      <html lang="en" className="custom-scrollbar w-[100%] max-w-[100%]">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </head>
        <body className={`${poppins.className}`}>
          <main>
            {children}
          </main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

