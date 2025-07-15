import React from 'react';
import Image from 'next/image';

interface ComparisonItem {
  title: string;
  matchbookCopy: string;
  competitorSupports: boolean;
}

interface ProsConsGridProps {
  title?: string;
  imageUrl?: string;
  competitorName?: string;
  comparisons?: ComparisonItem[];
}

// Text style configurations
const textConfig = {
  title: {
    fontFamily: "font-poppins",
    fontWeight: "font-medium",
    fontSize: "text-[40px]",
    lineHeight: "leading-[100%]",
    letterSpacing: "tracking-[-2px]",
    textAlign: "text-center",
    color: "text-[#281D1B]",
    marginBottom: "mb-6"
  },
  normalText: {
    fontFamily: "font-poppins",
    fontWeight: "font-normal",
    fontSize: "text-[12px]",
    lineHeight: "leading-[132%]",
    letterSpacing: "tracking-[0.22px]",
    textAlign: "text-center",
    color: "text-[#1F2A37]"
  },
  competitorText: {
    fontFamily: "font-poppins",
    fontWeight: "font-bold",
    fontSize: "text-[11px] md:text-[14px]",
    lineHeight: "leading-[100%] md:leading-[132%]",
    letterSpacing: "tracking-[0px] md:tracking-[0.22px]",
    textAlign: "text-center",
    color: "text-red-500"
  }
};

// Compile text styles
const textStyles = {
  title: Object.values(textConfig.title).join(" "),
  normalText: Object.values(textConfig.normalText).join(" "),
  competitorText: Object.values(textConfig.competitorText).join(" ")
};

// Default comparison data
const defaultComparisons: ComparisonItem[] = [
  {
    title: "Free and easy to apply to properties",
    matchbookCopy: "Fill out one application, and you'll be able to apply for any listing available on our platform.",
    competitorSupports: false
  },
  {
    title: "MatchBook Renter Verification",
    matchbookCopy: "You can access your own renter screening and share it with anyone you choose.",
    competitorSupports: false
  },
  {
    title: "Rate your landlord",
    matchbookCopy: "Our rating system ensures you know who you're dealing with.",
    competitorSupports: false
  },
  {
    title: "Easy to pay rent",
    matchbookCopy: "Automatically pay rent directly from your bank account for free or with a credit card for a fee",
    competitorSupports: false
  }
];

export const ProsConsGrid: React.FC<ProsConsGridProps> = ({
  title = "MatchBook Makes Renting Easy",
  imageUrl = "/marketing-images/pros-cons/1.png",
  competitorName = "Furnished Finder",
  comparisons = defaultComparisons
}) => {
  // SVG components for reuse
  const CheckmarkSvg = () => (
    <Image src="/marketing-images/pros-cons/tick.svg" alt="Check" width={27} height={27} className="h-[15px] w-[15px] md:h-[27.4px] md:w-[27.4px] mb-1" />
  );

  const CrossSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" className="h-[15px] w-[15px] md:h-[26px] md:w-[26px] mb-2">
      <path d="M12.5 25C10.7708 25 9.14583 24.6719 7.625 24.0156C6.10417 23.3594 4.78125 22.4688 3.65625 21.3438C2.53125 20.2188 1.64062 18.8958 0.984375 17.375C0.328125 15.8542 0 14.2292 0 12.5C0 10.7708 0.328125 9.14583 0.984375 7.625C1.64062 6.10417 2.53125 4.78125 3.65625 3.65625C4.78125 2.53125 6.10417 1.64062 7.625 0.984375C9.14583 0.328125 10.7708 0 12.5 0C14.2292 0 15.8542 0.328125 17.375 0.984375C18.8958 1.64062 20.2188 2.53125 21.3438 3.65625C22.4688 4.78125 23.3594 6.10417 24.0156 7.625C24.6719 9.14583 25 10.7708 25 12.5C25 14.2292 24.6719 15.8542 24.0156 17.375C23.3594 18.8958 22.4688 20.2188 21.3438 21.3438C20.2188 22.4688 18.8958 23.3594 17.375 24.0156C15.8542 24.6719 14.2292 25 12.5 25ZM12.5 22.5C13.625 22.5 14.7083 22.3177 15.75 21.9531C16.7917 21.5885 17.75 21.0625 18.625 20.375L4.625 6.375C3.9375 7.25 3.41146 8.20833 3.04688 9.25C2.68229 10.2917 2.5 11.375 2.5 12.5C2.5 15.2917 3.46875 17.6562 5.40625 19.5938C7.34375 21.5312 9.70833 22.5 12.5 22.5ZM20.375 18.625C21.0625 17.75 21.5885 16.7917 21.9531 15.75C22.3177 14.7083 22.5 13.625 22.5 12.5C22.5 9.70833 21.5312 7.34375 19.5938 5.40625C17.6562 3.46875 15.2917 2.5 12.5 2.5C11.375 2.5 10.2917 2.68229 9.25 3.04688C8.20833 3.41146 7.25 3.9375 6.375 4.625L20.375 18.625Z" fill="#DC1C1C"/>
    </svg>
  );

  return (
    <div className="max-w-[1000px] mx-auto px-4">
      <h2 className={`${textStyles.title} text-[clamp(20px,4.5vw,40px)] tracking-[clamp(-1px,-0.05vw,-2px)] pb-2`}>
        {title}
      </h2>
      <div className="flex flex-col lg:flex-row gap-2 mt-16">
        {/* Image - Top on mobile, Left on desktop */}
        <div className="w-full lg:flex-1 relative h-[450px] lg:h-auto lg:min-h-[600px]">
          <Image
            src={imageUrl}
            alt="MatchBook Marketing"
            fill
            className="object-cover rounded-lg shadow-md object-[45%_35%]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={85}
          />
        </div>

        {/* Comparison Grid - Bottom on mobile, Right on desktop */}
        <div className="w-full lg:w-[655px] grid grid-cols-3 gap-0">
          {/* Header Row */}
          <div className="w-full lg:w-[218.33px] h-[130px] lg:h-[153.8px] p-1 lg:p-4 flex flex-col items-center justify-center border-r-2 border-b-2 border-gray-200">
          </div>
          <div className="w-full lg:w-[218.33px] h-[130px] lg:h-[153.8px] p-1 lg:p-4 flex flex-col items-center justify-center border-r-2 border-b-2 border-gray-200">
            <Image src="/new-green-logo.png" alt="MatchBook Logo" width={150} height={50} className="object-contain max-h-full max-w-full" />
          </div>
          <div className="w-full lg:w-[218.33px] h-[130px] lg:h-[153.8px] p-1 lg:p-4 flex flex-col items-center justify-center border-b-2 border-r-2 border-gray-200">
            <span className={textStyles.competitorText}>{competitorName}</span>
          </div>

          {/* Comparison Rows */}
          {comparisons.map((item, index) => {
            const isLast = index === comparisons.length - 1;
            return (
              <React.Fragment key={index}>
                {/* Feature Title */}
                <div className={`w-full lg:w-[218.33px] h-[130px] lg:h-[153.8px] p-1 lg:p-4 flex flex-col items-center justify-center border-r-2 border-b-2 border-gray-200 overflow-hidden`}>
                  <span className={`${textStyles.normalText} break-words text-[10px] md:text-[12px]`}>{item.title}</span>
                </div>
                
                {/* Matchbook Column */}
                <div className={`w-full lg:w-[218.33px] h-[130px] lg:h-[153.8px] p-1 lg:p-4 flex flex-col items-center justify-center border-r-2 border-b-2 border-gray-200 gap-1 overflow-hidden`}>
                  <CheckmarkSvg />
                  <span className={`${textStyles.normalText} break-words text-[10px] md:text-[12px]`}>{item.matchbookCopy}</span>
                </div>
                
                {/* Competitor Column */}
                <div className={`w-full lg:w-[218.33px] h-[130px] lg:h-[153.8px] p-1 lg:p-4 flex flex-col items-center justify-center border-b-2 border-r-2 border-gray-200`}>
                  {item.competitorSupports ? <CheckmarkSvg /> : <CrossSvg />}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProsConsGrid;
