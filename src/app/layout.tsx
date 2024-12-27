import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Lora, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });
const lora = Lora({ subsets: ["latin"], variable: '--font-lora' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export const metadata: Metadata = {
  title: "Matchbook Rentals | Coming Soon",
  description: "Your place, all in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="custom-scrollbar w-[100%] max-w-[100%]">
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `window.fwSettings={'widget_id':157000000242};!function(){if("function"!=typeof window.FreshworksWidget){var n=function(){n.q.push(arguments)};n.q=[],window.FreshworksWidget=n}}()`
            }}
          />
          <script type='text/javascript' src='https://widget.freshworks.com/widgets/157000000242.js' async defer></script>
        </head>
        <body className={`${lora.className} ${montserrat.variable}`}>
          <main>
            {children}
          </main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
