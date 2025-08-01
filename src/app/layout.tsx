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
  title: "MatchBook Rentals",
  description: "Flexible Rentals",
  openGraph: {
    title: "MatchBook Rentals",
    description: "Flexible Rentals",
    images: [
      {
        url: "https://matchbookrentals.com/preview-logo.png",
        width: 1200,
        height: 630,
        alt: "MatchBook Rentals"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "MatchBook Rentals",
    description: "Flexible Rentals",
    images: ["https://matchbookrentals.com/preview-logo.png"]
  },
  ...(process.env.NODE_ENV === 'production' ? (
    console.log('Including Google verification meta tag in production'),
    {
      verification: {
        google: "XJpEs07in_iMKsAs3665PCSsVySuAk8ho1AYBzYxXos"
      }
    }
  ) : (
    console.log('Skipping Google verification meta tag in development'),
    {}
  )),
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
          {process.env.NODE_ENV === 'production' ? (
            (console.log('Loading Google Tag Manager script in production'),
            <script
              dangerouslySetInnerHTML={{
                __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PKKBSZQ7');`
              }}
            />)
          ) : (
            console.log('Skipping Google Tag Manager script in development')
          )}
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </head>
        <body className={`${poppins.className}`}>
          {process.env.NODE_ENV === 'production' ? (
            (console.log('Including Google Tag Manager noscript fallback in production'),
            <noscript>
              <iframe
                src="https://www.googletagmanager.com/ns.html?id=GTM-PKKBSZQ7"
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>)
          ) : (
            console.log('Skipping Google Tag Manager noscript fallback in development')
          )}
          <main>
            {children}
          </main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

