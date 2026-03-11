interface SectionHeaderProps {
  title: string;
  count?: number;
  actions?: React.ReactNode;
  inlineActions?: boolean;
}

export const SectionHeader = ({ title, count, actions, inlineActions = false }: SectionHeaderProps) => (
  <div className="flex items-center justify-between mb-4 py-1">
    <div className="flex items-center gap-2">
      <h2 className="font-poppins font-semibold text-[#484a54] text-sm">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-sm text-gray-500">({count})</span>
      )}
      {inlineActions && actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
    {!inlineActions && actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
