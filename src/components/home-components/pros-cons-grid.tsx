import React from 'react';

interface ProsConsGridProps {
  title?: string;
  imageUrl?: string;
}

export const ProsConsGrid: React.FC<ProsConsGridProps> = ({
  title = "Matchbook Makes Renting Easy",
  imageUrl = "/img/home-page/marketing-1.png"
}) => {
  return (
    <div className="container mx-auto px-4 my-36">
      <h2 className="text-[#281D1B] font-lora text-[48px] font-semibold leading-[52px] tracking-[-0.96px] mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="flex flex-col">
          <div className="mt-4">
            <img
              src={imageUrl}
              alt="Matchbook Marketing"
              className="w-full h-auto rounded-lg shadow-md"
            />
          </div>
        </div>

        {/* Right Column - Grid with 4 rows */}
        <div className="grid grid-cols-3 grid-rows-4 gap-0">
          {/* Header Row */}
          <div className="p-4 flex flex-col items-center justify-center border-r border-b">
          </div>
          <div className="p-4 flex flex-col items-center justify-center border-r border-b border-l">
            <img src="/navbar-logo-full.png" alt="Matchbook Logo" className="h-8" />
          </div>
          <div className="p-4 flex flex-col items-center justify-center border-b border-l">
            <span className="text-sm text-red-500 font-medium text-center">Furnished Finders</span>
          </div>

          {/* Row 1 */}
          <div className="p-4 flex flex-col items-center justify-center border-r border-b border-t">
            <span className="text-sm text-gray-700 text-center">Free and Easy to Apply on our Site</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center border-r border-b border-l border-t">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-700 text-center">Fill out one application, and you&apos;ll be able to apply for any listing available on our platform.</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center border-b border-l border-t">
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" className="mb-2">
              <path d="M12.5 25C10.7708 25 9.14583 24.6719 7.625 24.0156C6.10417 23.3594 4.78125 22.4688 3.65625 21.3438C2.53125 20.2188 1.64062 18.8958 0.984375 17.375C0.328125 15.8542 0 14.2292 0 12.5C0 10.7708 0.328125 9.14583 0.984375 7.625C1.64062 6.10417 2.53125 4.78125 3.65625 3.65625C4.78125 2.53125 6.10417 1.64062 7.625 0.984375C9.14583 0.328125 10.7708 0 12.5 0C14.2292 0 15.8542 0.328125 17.375 0.984375C18.8958 1.64062 20.2188 2.53125 21.3438 3.65625C22.4688 4.78125 23.3594 6.10417 24.0156 7.625C24.6719 9.14583 25 10.7708 25 12.5C25 14.2292 24.6719 15.8542 24.0156 17.375C23.3594 18.8958 22.4688 20.2188 21.3438 21.3438C20.2188 22.4688 18.8958 23.3594 17.375 24.0156C15.8542 24.6719 14.2292 25 12.5 25ZM12.5 22.5C13.625 22.5 14.7083 22.3177 15.75 21.9531C16.7917 21.5885 17.75 21.0625 18.625 20.375L4.625 6.375C3.9375 7.25 3.41146 8.20833 3.04688 9.25C2.68229 10.2917 2.5 11.375 2.5 12.5C2.5 15.2917 3.46875 17.6562 5.40625 19.5938C7.34375 21.5312 9.70833 22.5 12.5 22.5ZM20.375 18.625C21.0625 17.75 21.5885 16.7917 21.9531 15.75C22.3177 14.7083 22.5 13.625 22.5 12.5C22.5 9.70833 21.5312 7.34375 19.5938 5.40625C17.6562 3.46875 15.2917 2.5 12.5 2.5C11.375 2.5 10.2917 2.68229 9.25 3.04688C8.20833 3.41146 7.25 3.9375 6.375 4.625L20.375 18.625Z" fill="#DC1C1C"/>
            </svg>
          </div>

          {/* Row 2 */}
          <div className="p-4 flex flex-col items-center justify-center border-r border-b border-t">
            <span className="text-sm text-gray-700 text-center">Matchbook Renter Verification</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center border-r border-b border-l border-t">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-700 text-center">You can access your own renter screening and share it with anyone you choose.</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center border-b border-l border-t">
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" className="mb-2">
              <path d="M12.5 25C10.7708 25 9.14583 24.6719 7.625 24.0156C6.10417 23.3594 4.78125 22.4688 3.65625 21.3438C2.53125 20.2188 1.64062 18.8958 0.984375 17.375C0.328125 15.8542 0 14.2292 0 12.5C0 10.7708 0.328125 9.14583 0.984375 7.625C1.64062 6.10417 2.53125 4.78125 3.65625 3.65625C4.78125 2.53125 6.10417 1.64062 7.625 0.984375C9.14583 0.328125 10.7708 0 12.5 0C14.2292 0 15.8542 0.328125 17.375 0.984375C18.8958 1.64062 20.2188 2.53125 21.3438 3.65625C22.4688 4.78125 23.3594 6.10417 24.0156 7.625C24.6719 9.14583 25 10.7708 25 12.5C25 14.2292 24.6719 15.8542 24.0156 17.375C23.3594 18.8958 22.4688 20.2188 21.3438 21.3438C20.2188 22.4688 18.8958 23.3594 17.375 24.0156C15.8542 24.6719 14.2292 25 12.5 25ZM12.5 22.5C13.625 22.5 14.7083 22.3177 15.75 21.9531C16.7917 21.5885 17.75 21.0625 18.625 20.375L4.625 6.375C3.9375 7.25 3.41146 8.20833 3.04688 9.25C2.68229 10.2917 2.5 11.375 2.5 12.5C2.5 15.2917 3.46875 17.6562 5.40625 19.5938C7.34375 21.5312 9.70833 22.5 12.5 22.5ZM20.375 18.625C21.0625 17.75 21.5885 16.7917 21.9531 15.75C22.3177 14.7083 22.5 13.625 22.5 12.5C22.5 9.70833 21.5312 7.34375 19.5938 5.40625C17.6562 3.46875 15.2917 2.5 12.5 2.5C11.375 2.5 10.2917 2.68229 9.25 3.04688C8.20833 3.41146 7.25 3.9375 6.375 4.625L20.375 18.625Z" fill="#DC1C1C"/>
            </svg>
          </div>

          {/* Row 3 */}
          <div className="p-4 flex flex-col items-center justify-center border-r border-t">
            <span className="text-sm text-gray-700 text-center">Rate your landlord</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center border-r border-l border-t">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-700 text-center">Our rating system ensures you know who you&apos;re dealing with.</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center border-l border-t">
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" className="mb-2">
              <path d="M12.5 25C10.7708 25 9.14583 24.6719 7.625 24.0156C6.10417 23.3594 4.78125 22.4688 3.65625 21.3438C2.53125 20.2188 1.64062 18.8958 0.984375 17.375C0.328125 15.8542 0 14.2292 0 12.5C0 10.7708 0.328125 9.14583 0.984375 7.625C1.64062 6.10417 2.53125 4.78125 3.65625 3.65625C4.78125 2.53125 6.10417 1.64062 7.625 0.984375C9.14583 0.328125 10.7708 0 12.5 0C14.2292 0 15.8542 0.328125 17.375 0.984375C18.8958 1.64062 20.2188 2.53125 21.3438 3.65625C22.4688 4.78125 23.3594 6.10417 24.0156 7.625C24.6719 9.14583 25 10.7708 25 12.5C25 14.2292 24.6719 15.8542 24.0156 17.375C23.3594 18.8958 22.4688 20.2188 21.3438 21.3438C20.2188 22.4688 18.8958 23.3594 17.375 24.0156C15.8542 24.6719 14.2292 25 12.5 25ZM12.5 22.5C13.625 22.5 14.7083 22.3177 15.75 21.9531C16.7917 21.5885 17.75 21.0625 18.625 20.375L4.625 6.375C3.9375 7.25 3.41146 8.20833 3.04688 9.25C2.68229 10.2917 2.5 11.375 2.5 12.5C2.5 15.2917 3.46875 17.6562 5.40625 19.5938C7.34375 21.5312 9.70833 22.5 12.5 22.5ZM20.375 18.625C21.0625 17.75 21.5885 16.7917 21.9531 15.75C22.3177 14.7083 22.5 13.625 22.5 12.5C22.5 9.70833 21.5312 7.34375 19.5938 5.40625C17.6562 3.46875 15.2917 2.5 12.5 2.5C11.375 2.5 10.2917 2.68229 9.25 3.04688C8.20833 3.41146 7.25 3.9375 6.375 4.625L20.375 18.625Z" fill="#DC1C1C"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProsConsGrid;