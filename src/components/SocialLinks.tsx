
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
        className="text-gray-500 hover:text-black"
        prefetch={false}
      >
        <TwitterIcon className="h-6 w-6" />
      </Link>
      <Link
        href="https://www.facebook.com/share/MpdT4CSW4cp75vZh/?mibextid=LQQJ4d"
        className="text-gray-500 hover:text-black"
        prefetch={false}
      >
        <FacebookIcon className="h-6 w-6" />
      </Link>
      <Link
        href="https://www.instagram.com/matchbookrentals?igsh=MWh4NngyZ2Q4Nnlmbw=="
        className="text-gray-500 hover:text-black"
        prefetch={false}
      >
        <InstagramIcon className="h-6 w-6" />
      </Link>
      <Link
        href="https://www.tiktok.com/@matchbookrentals?_t=8qlshKMhmfe&_r=1"
        className="text-gray-500 hover:text-black"
        prefetch={false}
      >
        <FaTiktok className="h-6 w-6" />
      </Link>
      <Link
        href="https://www.linkedin.com/company/matchbookrentals/"
        className="text-gray-500 hover:text-black"
        prefetch={false}
      >
        <LinkedinIcon className="h-6 w-6" />
      </Link>
    </div>
  );
}
