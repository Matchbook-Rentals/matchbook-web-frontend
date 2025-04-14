
import React from "react";
import { Button } from "../../components/ui/button";
import { useRouter } from "next/navigation";

export const BecomeHostCopy = (): JSX.Element => {
  const router = useRouter();

  return (
    <section className="flex flex-col max-w-[1260px] my-60 w-full mx-auto items-center gap-9 py-8">
      <h1 className="w-full font-['Poppins',Helvetica] font-medium text-[#271c1a] text-5xl text-center tracking-[-0.96px] leading-[68px]">
        Interested in becoming a host?
      </h1>

      <p className="w-full font-['Poppins',Helvetica] font-normal text-[#271c1a] text-2xl text-center tracking-[-0.12px] leading-8">
        Check out what we have to offer
      </p>

      <Button 
        onClick={() => router.push('/hosts')}
        className="px-8 py-3.5 bg-[#c68087ad] hover:bg-[#c68087] rounded-2xl font-['Public_Sans',Helvetica] font-medium text-[#050000] text-xl tracking-[0] leading-6"
      >
        Learn More
      </Button>
        
    </section>
  );
};
