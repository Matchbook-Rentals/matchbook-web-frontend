'use client'

import { BrandHeart, RejectIcon, ReturnIcon } from '@/components/svgs/svg-components';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionPopupProps {
  action: 'like' | 'dislike' | 'back';
  isVisible: boolean;
}

const ActionPopup: React.FC<ActionPopupProps> = ({ action, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            scale: 0.5,
            opacity: 0,
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100
          }}
          animate={{
            scale: [0.5, 1.2, 1],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 0.6,
            times: [0, 0.3, 1]
          }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-charcoalBrand rounded-full w-36 h-36 flex p-8 opacity-50 items-center justify-center">
            {action === 'like' ? (
              <BrandHeart className="w-32 h-32 text-[#A3B899]" />
            ) : action === 'dislike' ? (
              <RejectIcon className="w-32 h-32 text-[#E697A2]" />
            ) : (
              <ReturnIcon className="w-32 h-32 text-[#6CC3FF]" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActionPopup;