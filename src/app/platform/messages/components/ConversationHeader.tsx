import React from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { UserRating } from '@/components/reviews/host-review';

interface ConversationHeaderProps {
  selectedConversation: any;
  participantInfo: {
    displayName: string;
    imageUrl: string;
  };
  onBack?: () => void;
  isMobile: boolean;
  handleBackClick: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  selectedConversation,
  participantInfo,
  onBack,
  isMobile,
  handleBackClick
}) => {
  return (
    <div className='h-[72px] border-b-2 flex items-center'>
      {selectedConversation ? (
        <div className="w-full relative flex justify-between items-center ">
        <div className='flex space-x-4'>
          {onBack && (
            <button
              onClick={handleBackClick}
              className="md:hidden ml-4 rounded-full bg-transparent"
            >
              <ArrowLeftIcon size={24} />
            </button>
          )}
          <div className="flex items-center justify-center w-fit md:justify-start md:pl-[calc(2.5vw+7px)]">
            <img
              src={participantInfo.imageUrl}
              alt={participantInfo.displayName}
              className="w-12 h-12 aspect-square rounded-full object-cover mr-4"
            />
            <div className="flex justify-between w-full gap-4">
              <p className="overflow-hidden text-[#212121] max-w-[200px] md:max-w-[500px] truncate text-base sm:text-lg md:text-xl lg:text-[18px] font-medium leading-tight">
                {participantInfo.displayName}
              </p>
            </div>
          </div>
          </div>

          <Dialog>
            <DialogTrigger>
              <Button>
                Show Review
              </Button>
            </DialogTrigger>
            <DialogContent className=''>
              <DialogHeader className='pl-[5%] w-full mx-auto'>
                <p className='text-center font-medium text-lg'>
                  Reviews for {participantInfo.displayName}
                </p>
              </DialogHeader>
              <UserRating avatarImgUrl={participantInfo.imageUrl} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="bg-blueBrand/10 w-full mx-auto p-4 flex items-center md:hidden shadow-md">
          {onBack && isMobile && (
            <button
              onClick={handleBackClick}
              className="md:hidden flex items-center justify-center p-2 rounded-full bg-transparent"
            >
              <ArrowLeftIcon size={20} />
            </button>
          )}
          <div className="w-full text-center font-medium">
            Select a conversation
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationHeader;
