import Link from "next/link";
import SocialLinks from "../SocialLinks";
export default function Footer() {

  return (
    <footer className="border-t  border-gray-200 pt-4 pb-24 lg:pb-2">
      <div className=" mx-auto flex flex-col lg:flex-row justify-between w-full md:w-[90vw] lg:w-[80vw]">
        {/* Company Logo and Tagline */}
        <div className="flex flex-col  items-center gap-4 px-4 sm:px-6 md:px-8">
          <img className="h-8" src="/navbar-logo-full.png" alt="Company Logo" />
          <img
            className=" h-[100px]"
            src="/village_footer.png"
            alt="Village Footer"
          />
        </div>

        {/* Links Section */}
        <div className="flex justify-between w-full pt-3 lg:w-1/2 gap-2 lg:gap-0 ">
          {/* Navigation Links */}
          <div className="text-lg mx-auto ">
            <h3 className="text-xl font-semibold">Navigation</h3>
            <nav className="flex flex-col ">
              <Link
                href="/#"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                Home
              </Link>
              <Link
                href="/about/#"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                About
              </Link>
              <Link
                href="/contact/#"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Resource Links */}
          <div className="text-lg mx-auto">
            <h3 className="text-xl font-semibold">Resources</h3>
            <nav className="flex flex-col">
              <Link
                href="/blog"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                Blog
              </Link>
              <Link
                href="/faq"
                className="text-gray-500 hover:text-black"
                prefetch={true}
              >
                FAQ
              </Link>
              <Link
                href="#"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                Support
              </Link>
            </nav>
          </div>

          {/* Social Media Links */}
          <div className="text-lg mx-auto">
            <h3 className="text-xl font-semibold">Follow Us</h3>
            <SocialLinks className="pt-3 md:pt-6 w-[88px] md:w-auto justify-center" />
          </div>
        </div>
      </div>
    </footer>
  )
};
