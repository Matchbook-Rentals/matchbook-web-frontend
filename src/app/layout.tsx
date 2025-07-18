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
  verification: {
    google: "XJpEs07in_iMKsAs3665PCSsVySuAk8ho1AYBzYxXos"
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png?v=2",
    other: [
      { url: "/android-chrome-192x192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png?v=2", sizes: "512x512", type: "image/png" },
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
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PKKBSZQ7');`
            }}
          />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </head>
        <body className={`${poppins.className}`}>
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-PKKBSZQ7"
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
          <main>
            {children}
          </main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

