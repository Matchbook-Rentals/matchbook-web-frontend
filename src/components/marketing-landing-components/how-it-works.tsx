import React from 'react';


export const MarketingSteps: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-8">
      <div className="flex items-center justify-start space-x-4 ">
        <div className='mx-auto w-full '>
          <h1 className="text-4xl md:text-5xl z-10 w-full font-semibold text-right pr-5 " style={{ position: 'relative', top: '-50%', left: '' }}>How Matchbook Works</h1>
          <div className={`bg-pinkBrand transform -translate-y-[40%] -translate-x-[0%] w-full h-[30px]`}>
          </div>
          <div className="flex justify-evenly mt-8">
            {['Search', 'Apply', 'Match', 'Book'].map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full ${index === 0 ? 'bg-pinkBrand text-white border-pinkBrand' : 'bg-white text-black'} flex items-center justify-center font-bold mb-2 border-2 border-black`}>
                  {index + 1}
                </div>
                <span className="text-md font-semibold">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <h3 className='font-semibold text-xl py-5 w-4/5 mx-auto'>
        Browse listings that match your preferences and swipe on them! Swiping right means you love it, while swiping left sends them right to the friendzone.
      </h3>
    </div>
  );
};

