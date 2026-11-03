import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ActionItem {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface RowActionsProps {
  actions: ActionItem[];
}

export function RowActions({ actions }: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button 
        type="button"
        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 hover:text-slate-900 h-8 w-8 text-slate-700"
        onClick={() => setIsOpen(!isOpen)}
        title="Aksi Tambahan"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {actions.map((action, index) => {
              const Icon = action.icon;
              const isDestructive = action.variant === "destructive";
              return (
                <button 
                  key={index}
                  onClick={() => { action.onClick(); setIsOpen(false); }} 
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm flex items-center transition-colors",
                    isDestructive 
                      ? "text-rose-600 hover:bg-rose-50" 
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("mr-2 h-4 w-4 shrink-0", isDestructive ? "" : "text-slate-600")} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
