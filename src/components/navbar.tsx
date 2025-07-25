import React from "react";
import Image from "next/image";
import UserMenu from "./userMenu";

export default async function NavBar() {

  return (
    <nav className="bg-primaryBrand flex md:justify-between justify-center py-3 w-full ">
      <Image
        src={"/logo-nav-full.png"}
        alt="logo"
        width={450}
        height={450}
        className="hidden md:block"
      />
      <div className="flex items-center justify-between md:justify-end  w-full gap-6 md:pr-12 pr-2 pl-2">
        <button className="rounded-full xl:mr-10 bg-white text-lg border border-gray-500 pl-6 pr-8 py-3 text-gray-500 text-center ">
          List your place
        </button>
        {/* hasListings={undefined} - this navbar doesn't pass user context, so listing count is not relevant */}
        <UserMenu color="white" hasListings={undefined} />
      </div>
    </nav>
  );
}
