import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoveHorizontal } from "lucide-react";

interface StickyTableWrapperProps {
  children: React.ReactNode;
  className?: string;
  tableContainerClassName?: string;
  showControls?: boolean;
  label?: string;
}

export function StickyTableWrapper({
  children,
  className = "",
  tableContainerClassName = "",
  showControls = true,
  label = "Scroll Bar Horizontal (Standby)"
}: StickyTableWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const syncBarRef = useRef<HTMLDivElement>(null);
  
  const [hasOverflow, setHasOverflow] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [visibleWidth, setVisibleWidth] = useState(0);

  // Measure overflow and update state
  const checkOverflow = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollWidth, clientWidth, scrollLeft } = el;
    const overflow = scrollWidth > clientWidth + 2;
    setHasOverflow(overflow);
    setContentWidth(scrollWidth);
    setVisibleWidth(clientWidth);

    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const progress = Math.min(100, Math.max(0, Math.round((scrollLeft / maxScroll) * 100)));
    setScrollProgress(progress);
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < maxScroll - 2);

    // Sync floating bar scrollLeft if out of sync
    if (syncBarRef.current && Math.abs(syncBarRef.current.scrollLeft - scrollLeft) > 2) {
      syncBarRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  // Listen to container scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      checkOverflow();
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", checkOverflow);

    // Initial check and observer for dynamic table data
    checkOverflow();
    const observer = new ResizeObserver(() => checkOverflow());
    observer.observe(el);

    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkOverflow);
      observer.disconnect();
    };
  }, [checkOverflow]);

  // Sync scroll from floating bar to table container
  const handleSyncBarScroll = () => {
    if (!syncBarRef.current || !containerRef.current) return;
    containerRef.current.scrollLeft = syncBarRef.current.scrollLeft;
  };

  // Button scroll handlers
  const scrollBy = (offset: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const scrollToStart = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
  };

  const scrollToEnd = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ left: containerRef.current.scrollWidth, behavior: "smooth" });
  };

  return (
    <div className={`relative flex flex-col w-full ${className}`}>
      {/* Scrollable Table Viewport */}
      <div
        ref={containerRef}
        className={`overflow-x-auto w-full scroll-standby scrollbar-standby ${tableContainerClassName}`}
        tabIndex={0}
        aria-label="Tabel Data Sarpras dengan Scroll Bar Standby"
      >
        {children}
      </div>

      {/* Sticky Bottom Scrollbar Bar (Always Standby when horizontal overflow exists) */}
      {hasOverflow && (
        <div 
          className="sticky bottom-0 left-0 right-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-sky-400 dark:border-sky-600 shadow-[0_-6px_20px_rgba(0,100,200,0.12)] transition-all select-none print:hidden rounded-b-xl"
        >
          {/* Synced Native Scrollbar Track (Allows direct drag with mouse/touchpad/pen) */}
          <div
            ref={syncBarRef}
            onScroll={handleSyncBarScroll}
            className="overflow-x-scroll overflow-y-hidden w-full h-4 bg-sky-100/80 dark:bg-slate-800/80 cursor-ew-resize border-b border-sky-200 dark:border-slate-700"
            style={{
              scrollbarWidth: "auto",
            }}
            title="Geser scroll bar ini untuk menggeser tabel ke kiri/kanan"
          >
            {/* Dummy element that forces horizontal scrollbar with exact width of table content */}
            <div
              style={{
                width: `${contentWidth}px`,
                height: "1px",
              }}
            />
          </div>

          {/* Standby Controller Controls & Status Bar */}
          {showControls && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
              {/* Left Side: Status & Indicator */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-[11px] shadow-xs shrink-0 animate-pulse-once">
                  <MoveHorizontal className="w-3.5 h-3.5" />
                  <span>STANDBY</span>
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold text-[11px] hidden sm:inline">
                  {label}
                </span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px] font-mono">
                  Posisi: <strong className="text-sky-700 dark:text-sky-300">{scrollProgress}%</strong> ({Math.round(visibleWidth)}px / {Math.round(contentWidth)}px)
                </span>
              </div>

              {/* Right Side: Quick Scroll Steppers */}
              <div className="flex items-center gap-1 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={scrollToStart}
                  disabled={!canScrollLeft}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-800 dark:text-slate-200 transition-colors shadow-2xs text-[11px]"
                  title="Geser ke Kolom Paling Kiri (Awal)"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Awal</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollBy(-250)}
                  disabled={!canScrollLeft}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sky-700 dark:text-sky-400 transition-colors shadow-2xs text-[11px]"
                  title="Geser Kiri (250px)"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kiri</span>
                </button>

                {/* Visual Progress Bar Pill */}
                <div 
                  className="w-20 sm:w-28 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mx-1 cursor-pointer relative"
                  onClick={(e) => {
                    if (!containerRef.current) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = clickX / rect.width;
                    const max = containerRef.current.scrollWidth - containerRef.current.clientWidth;
                    containerRef.current.scrollTo({ left: pct * max, behavior: "smooth" });
                  }}
                  title="Klik pada garis ini untuk lompat ke posisi kolom"
                >
                  <div
                    className="h-full bg-sky-600 dark:bg-sky-500 rounded-full transition-all duration-150"
                    style={{ width: `${Math.max(15, scrollProgress)}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => scrollBy(250)}
                  disabled={!canScrollRight}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sky-700 dark:text-sky-400 transition-colors shadow-2xs text-[11px]"
                  title="Geser Kanan (250px)"
                >
                  <span>Kanan</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={scrollToEnd}
                  disabled={!canScrollRight}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-800 dark:text-slate-200 transition-colors shadow-2xs text-[11px]"
                  title="Geser ke Kolom Paling Kanan (Akhir)"
                >
                  <span className="hidden md:inline">Akhir</span>
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
