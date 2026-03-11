'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AccordionCardProps {
  icon: React.ReactNode;
  title: string;
  summary: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export function AccordionCard({ icon, title, summary, isExpanded, onToggle, children, className }: AccordionCardProps) {
  return (
    <div className={`rounded-2xl border border-gray-200 shadow-md overflow-hidden bg-background ${className || ''}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div className="text-gray-500">{icon}</div>
          <div className="text-left">
            <div className="text-xs font-medium text-gray-500">{title}</div>
            {!isExpanded && (
              <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                {summary}
              </div>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
