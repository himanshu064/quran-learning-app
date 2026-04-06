"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
}

interface VercelTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

export function VercelTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: VercelTabsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState<React.CSSProperties>({});
  const [activeStyle, setActiveStyle] = useState<React.CSSProperties>({
    left: "0px",
    width: "0px",
  });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = tabs.findIndex((tab) => tab.value === activeTab);

  // Hover highlight position
  useEffect(() => {
    if (hoveredIndex !== null) {
      const el = tabRefs.current[hoveredIndex];
      if (el) {
        setHoverStyle({
          left: `${el.offsetLeft}px`,
          width: `${el.offsetWidth}px`,
        });
      }
    }
  }, [hoveredIndex]);

  // Active indicator position
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = tabRefs.current[activeIndex];
      if (el) {
        setActiveStyle({
          left: `${el.offsetLeft}px`,
          width: `${el.offsetWidth}px`,
        });
      }
    });
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center gap-1", className)}
    >
      {/* Hover highlight */}
      <div
        className="pointer-events-none absolute top-0 h-full rounded-md bg-muted transition-all duration-200 ease-out"
        style={{
          ...hoverStyle,
          opacity: hoveredIndex !== null ? 1 : 0,
        }}
      />

      {/* Active underline indicator */}
      <div
        className="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-primary transition-all duration-300 ease-out"
        style={activeStyle}
      />

      {/* Tab buttons */}
      {tabs.map((tab, index) => (
        <button
          key={tab.value}
          ref={(el) => {
            tabRefs.current[index] = el;
          }}
          onClick={() => onTabChange(tab.value)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          className={cn(
            "relative z-10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
            activeTab === tab.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
