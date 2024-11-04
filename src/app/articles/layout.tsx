import Footer from "@/components/marketing-landing-components/footer";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";


export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MatchbookHeader />
      {children}
      <Footer />
    </>
  );
}

