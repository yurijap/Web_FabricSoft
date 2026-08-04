import React, { useState } from 'react';

export interface TabItem {
  label: string;
  content: React.ReactNode;
}

export const Tabs: React.FC<{ tabs: TabItem[] }> = ({ tabs }) => {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-zinc-800">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-colors ${
              active === idx
                ? 'bg-white/10 backdrop-blur-md border border-zinc-700 text-zinc-100'
                : 'bg-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4 border border-zinc-800 bg-[#17181B]/30 backdrop-blur-md rounded-b-xl">
        {tabs[active].content}
      </div>
    </div>
  );
};
