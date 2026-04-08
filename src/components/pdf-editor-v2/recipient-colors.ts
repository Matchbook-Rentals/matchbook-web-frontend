// Recipient color system matching Documenso implementation

export const RECIPIENT_COLOR_STYLES = {
  host: {
    base: 'ring-[#0B6E6E] hover:bg-[#0B6E6E]/30',
    fieldItem: 'group/field-item rounded-[2px]',
    fieldItemInitials: 'group-hover/field-item:bg-[#0B6E6E]',
    comboxBoxTrigger: 'ring-2 ring-[#0B6E6E] shadow-[0_0_0_5px_rgba(11,110,110,0.1)]',
  },
  primaryRenter: {
    base: 'ring-[#fb8c00] hover:bg-[#fb8c00]/30',
    fieldItem: 'group/field-item rounded-[2px]',
    fieldItemInitials: 'group-hover/field-item:bg-[#fb8c00]',
    comboxBoxTrigger: 'ring-2 ring-[#fb8c00] shadow-[0_0_0_5px_rgba(251,140,0,0.1)]',
  },
  blue: {
    base: 'ring-blue-500 hover:bg-blue-500/30',
    fieldItem: 'group/field-item rounded-[2px]',
    fieldItemInitials: 'group-hover/field-item:bg-blue-500',
    comboxBoxTrigger: 'ring-2 ring-blue-500 shadow-[0_0_0_5px_rgba(59,130,246,0.1)]',
  },
  purple: {
    base: 'ring-purple-500 hover:bg-purple-500/30',
    fieldItem: 'group/field-item rounded-[2px]',
    fieldItemInitials: 'group-hover/field-item:bg-purple-500',
    comboxBoxTrigger: 'ring-2 ring-purple-500 shadow-[0_0_0_5px_rgba(168,85,247,0.1)]',
  },
  green: {
    base: 'ring-green-500 hover:bg-green-500/30',
    fieldItem: 'group/field-item rounded-[2px]',
    fieldItemInitials: 'group-hover/field-item:bg-green-500',
    comboxBoxTrigger: 'ring-2 ring-green-500 shadow-[0_0_0_5px_rgba(34,197,94,0.1)]',
  },
  red: {
    base: 'ring-red-500 hover:bg-red-500/30',
    fieldItem: 'group/field-item rounded-[2px]',
    fieldItemInitials: 'group-hover/field-item:bg-red-500',
    comboxBoxTrigger: 'ring-2 ring-red-500 shadow-[0_0_0_5px_rgba(239,68,68,0.1)]',
  },
  pink: {
    base: 'ring-pink-500 hover:bg-pink-500/30',
    fieldItem: 'group/field-item rounded-[2px]',
    fieldItemInitials: 'group-hover/field-item:bg-pink-500',
    comboxBoxTrigger: 'ring-2 ring-pink-500 shadow-[0_0_0_5px_rgba(236,72,153,0.1)]',
  },
  indigo: {
    base: 'ring-indigo-500 hover:bg-indigo-500/30',
    fieldItem: 'group/field-item rounded-[2px]',
    fieldItemInitials: 'group-hover/field-item:bg-indigo-500',
    comboxBoxTrigger: 'ring-2 ring-indigo-500 shadow-[0_0_0_5px_rgba(99,102,241,0.1)]',
  },
  yellow: {
    base: 'ring-yellow-500 hover:bg-yellow-500/30',
    fieldItem: 'group/field-item rounded-[2px]',
    fieldItemInitials: 'group-hover/field-item:bg-yellow-500',
    comboxBoxTrigger: 'ring-2 ring-yellow-500 shadow-[0_0_0_5px_rgba(234,179,8,0.1)]',
  },
  emerald: {
    base: 'ring-emerald-500 hover:bg-emerald-500/30',
    fieldItem: 'group/field-item rounded-[2px]',
    fieldItemInitials: 'group-hover/field-item:bg-emerald-500',
    comboxBoxTrigger: 'ring-2 ring-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.1)]',
  },
} as const;

export const AVAILABLE_RECIPIENT_COLORS = ['host', 'primaryRenter', 'blue', 'purple', 'green', 'red', 'pink', 'indigo', 'yellow', 'emerald'] as const;

export type RecipientColorKey = typeof AVAILABLE_RECIPIENT_COLORS[number];

export const useRecipientColors = (index: number) => {
  const key = AVAILABLE_RECIPIENT_COLORS[index % AVAILABLE_RECIPIENT_COLORS.length];
  return RECIPIENT_COLOR_STYLES[key];
};