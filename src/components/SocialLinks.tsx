
import Link from "next/link";
import { FaTiktok } from "react-icons/fa";
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon } from "./Icons";

interface SocialLinksProps {
  className?: string;
}

export default function SocialLinks({ className = "" }: SocialLinksProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Link
        href="https://x.com/matchbookrent"
        className="bg-secondaryBrand hover:bg-secondaryBrand/80 text-white rounded-full p-1.5 md:p-2 transition-colors duration-200"
        prefetch={false}
      >
        <TwitterIcon className="h-5 w-5 md:h-6 md:w-6" />
      </Link>
      <Link
        href="https://www.facebook.com/share/MpdT4CSW4cp75vZh/?mibextid=LQQJ4d"
        className="bg-secondaryBrand hover:bg-secondaryBrand/80 text-white rounded-full p-1.5 md:p-2 transition-colors duration-200"
        prefetch={false}
      >
        <FacebookIcon className="h-5 w-5 md:h-6 md:w-6" />
      </Link>
      <Link
        href="https://www.instagram.com/matchbookrentals?igsh=MWh4NngyZ2Q4Nnlmbw=="
        className="bg-secondaryBrand hover:bg-secondaryBrand/80 text-white rounded-full p-1.5 md:p-2 transition-colors duration-200"
        prefetch={false}
      >
        <InstagramIcon className="h-5 w-5 md:h-6 md:w-6" />
      </Link>
      <Link
        href="https://www.tiktok.com/@matchbookrentals?_t=8qlshKMhmfe&_r=1"
        className="bg-secondaryBrand hover:bg-secondaryBrand/80 text-white rounded-full p-1.5 md:p-2 transition-colors duration-200"
        prefetch={false}
      >
        <FaTiktok className="h-5 w-5 md:h-6 md:w-6" />
      </Link>
      <Link
        href="https://www.linkedin.com/company/matchbookrentals/"
        className="bg-secondaryBrand hover:bg-secondaryBrand/80 text-white rounded-full p-1.5 md:p-2 transition-colors duration-200"
        prefetch={false}
      >
        <LinkedinIcon className="h-5 w-5 md:h-6 md:w-6" />
      </Link>
    </div>
  );
}
