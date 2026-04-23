import Link from "next/link";
import { FacebookIcon, InstagramIcon, LinkedinIcon } from "../Icons";

export default function Footer() {

  return (
    <footer className="border-t border-gray-200  py-6 md:py-6">
      <div className="mx-auto flex flex-col lg:flex-row justify-between w-full md:w-[90vw] lg:w-[80vw]">
        {/* Company Logo */}
        <div className="flex flex-col  items-center gap-4 px-4 sm:px-6 md:px-8">
          <img className="h-6" src="/new-green-logo.png" alt="Company Logo" />
        </div>

        {/* Links Section */}
        <div className="[container-type:inline-size] flex justify-between w-full pt-5 lg:w-3/5 gap-2 lg:gap-0 ">
          {/* Navigation + inline Resources (inline copy hides when container is wide enough for a standalone Resources column) */}
          <div className="text-lg mx-auto ">
            <h3 className="text-xl font-semibold">Navigation</h3>
            <nav className="flex flex-col gap-1.5 mt-2">
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
            <h3 className="text-xl font-semibold mt-4 [@container(min-width:640px)]:hidden">Resources</h3>
            <nav className="flex flex-col gap-1.5 mt-2 [@container(min-width:640px)]:hidden">
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

          {/* Standalone Resources column (only shown when container is wide enough) */}
          <div className="text-lg mx-auto hidden [@container(min-width:640px)]:block">
            <h3 className="text-xl font-semibold">Resources</h3>
            <nav className="flex flex-col gap-1.5 mt-2">
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

          {/* Legal Links - hidden on small, shown on sm+ */}
          <div className="text-lg mx-auto hidden sm:block">
            <h3 className="text-xl font-semibold">Legal</h3>
            <nav className="flex flex-col gap-1.5 mt-2">
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
            <div className="flex gap-2 pt-3 pb-4">
              <Link
                href="https://www.facebook.com/share/MpdT4CSW4cp75vZh/?mibextid=LQQJ4d"
                className="bg-secondaryBrand hover:bg-secondaryBrand/80 text-white rounded-full p-1.5 md:p-2.5 transition-colors duration-200"
                prefetch={false}
              >
                <FacebookIcon className="h-4 w-4 md:h-6 md:w-6 lg:h-7 lg:w-7" />
              </Link>
              <Link
                href="https://www.instagram.com/matchbookrentals?igsh=MWh4NngyZ2Q4Nnlmbw=="
                className="bg-secondaryBrand hover:bg-secondaryBrand/80 text-white rounded-full p-1.5 md:p-2.5 transition-colors duration-200"
                prefetch={false}
              >
                <InstagramIcon className="h-4 w-4 md:h-6 md:w-6 lg:h-7 lg:w-7" />
              </Link>
              <Link
                href="https://www.linkedin.com/company/matchbookrentals/"
                className="bg-secondaryBrand hover:bg-secondaryBrand/80 text-white rounded-full p-1.5 md:p-2.5 transition-colors duration-200"
                prefetch={false}
              >
                <LinkedinIcon className="h-4 w-4 md:h-6 md:w-6 lg:h-7 lg:w-7" />
              </Link>
            </div>

            {/* Legal Links - mobile only, stacked under social icons in the Follow Us column */}
            <div className="sm:hidden mt-6">
              <h3 className="text-xl font-semibold">Legal</h3>
              <nav className="flex flex-col gap-1.5 mt-2">
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
          </div>
        </div>
      </div>
    </footer>
  )
};
