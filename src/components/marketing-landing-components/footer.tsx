import Link from "next/link";
import SocialLinks from "../SocialLinks";

// TODO: Rework sub-desktop views. One idea is moving the social links to a new row at mobile.

export default function Footer() {

  return (
    <footer className="border-t border-gray-200  py-6 md:py-6">
      <div className="mx-auto flex flex-col lg:flex-row justify-between w-full md:w-[90vw] lg:w-[80vw]">
        {/* Company Logo and Tagline */}
        <div className="flex flex-col  items-center gap-4 px-4 sm:px-6 md:px-8">
          <img className="h-6" src="/new-green-logo.png" alt="Company Logo" />
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
                About Us
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
                href="/articles"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                Articles
              </Link>
              <Link
                href="/faq"
                className="text-gray-500 hover:text-black"
                prefetch={true}
              >
                FAQ
              </Link>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="text-lg mx-auto">
            <h3 className="text-xl font-semibold">Legal</h3>
            <nav className="flex flex-col">
              <Link
                href="/terms-of-service"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy-policy"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                Privacy Policy
              </Link>
              <Link
                href="/acceptable-use-policy"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                Acceptable Use
              </Link>
              <Link
                href="/california-privacy-notice"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                CA Privacy Notice
              </Link>
              <Link
                href="/cookie-notice"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                Cookie Notice
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
