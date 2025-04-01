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
  title: "Matchbook Rentals | Coming Soon",
  description: "Your place, all in one place",
};

const localization={
  signIn: {
    start: {
      title: 'Welcome to Matchbook',
      subtitle: 'Find a place you love'
    }
  },
  signUp: {
    start: {
      title: 'Welcome to Matchbook',
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
        layout: {logoImageUrl: '/House_Logo.png', socialButtonsPlacement: 'bottom', socialButtonsVariant: 'blockButton'}}
    }>
      <html lang="en" className="custom-scrollbar w-[100%] max-w-[100%]">
        <head>
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

