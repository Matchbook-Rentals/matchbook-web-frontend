import Link from 'next/link';

export default function NavMenu() {
  return (
    <div className="w-48 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col">
        <Link href="/app/rent/searches">
          <button className="px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 w-full">Searches</button>
        </Link>
        <Link href="/">
          <button className="px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 w-full">Application</button>
        </Link>
        <Link href="/">
          <button className="px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 w-full">Bookings</button>
        </Link>
      </div>

      <div className="border-t border-gray-200">
        <Link href="/app/rent/messages">
          <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">Inbox</button>
        </Link>
      </div>

      <div className="border-t border-gray-200">
        <Link href="/">
          <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">
            Switch to Hosting
          </button>
        </Link>
      </div>

      {/* Additional links from UserMenu */}
      <div className="border-t border-gray-200">
        <Link href="/">
          <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">Home</button>
        </Link>
        <Link href="/admin">
          <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">Admin Dashboard</button>
        </Link>
        <Link href="/">
          <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">Support</button>
        </Link>
        <Link href="/">
          <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">Settings</button>
        </Link>
      </div>
    </div>
  )
}