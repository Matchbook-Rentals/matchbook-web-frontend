import Link from "next/link";
import { ApartmentIcon } from "../svgs/svg-components";

export default function Footer() {
  return (
    <footer className="border-t  border-gray-200 pt-4 pb-2">
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
                href="#"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                Home
              </Link>
              <Link
                href="#"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                About
              </Link>
              <Link
                href="#"
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
                href="#"
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
            <div className="flex gap-x-2 pt-6  ">
              <Link
                href="#"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                <TwitterIcon className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                <FacebookIcon className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                <InstagramIcon className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="text-gray-500 hover:text-black"
                prefetch={false}
              >
                <LinkedinIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Facebook icon SVG component
function FacebookIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// Instagram icon SVG component
function InstagramIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// LinkedIn icon SVG component
function LinkedinIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

// Mountain icon SVG component (currently unused in the footer)
function MountainIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

// Twitter icon SVG component
function TwitterIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}
