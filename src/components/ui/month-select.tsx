import React from 'react';

interface MonthSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const MonthSelect: React.FC<MonthSelectProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex items-center space-x-2 relative">
      <select
        value={value}
        onChange={handleChange}
        className="border rounded-[5px] p-2 appearance-none pr-8 bg-background "
        style={{
          backgroundImage: `
            url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE0LjI5MjkgMTEuNzA3MUw4LjAwMDAxIDYuNDE0MjdMMS43MDcxNCAxMS43MDcxIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K),
            url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE0LjI5MjkgNC4yOTI5MUw4LjAwMDAxIDkuNTg1NzNMMS43MDcxNCA0LjI5MjkxIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K)
          `,
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundPosition: 'right 0.5rem top, right 0.5rem bottom 5px'
        }}
      >
        {[...Array(12)].map((_, i) => (
          <option className="bg-background hover:bg-gray-100 active:bg-gray-100 focus:bg-gray-100" key={i + 1} value={`${i + 1}`}>
            {i + 1}
          </option>
        ))}
      </select>
      <span>Months</span>
    </div>
  );
};

export default MonthSelect;