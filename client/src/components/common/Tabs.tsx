import React from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsProps): React.ReactElement {
  return (
    <div
      className={`flex items-center space-x-1 border-b border-detective-border overflow-x-auto no-scrollbar ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all duration-150 whitespace-nowrap cursor-pointer ${
              isActive
                ? "border-purple-500 text-purple-300 font-extrabold bg-purple-950/40 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            {tab.icon && <span className={`shrink-0 ${isActive ? "text-purple-400" : "text-slate-400"}`}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700/60"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

