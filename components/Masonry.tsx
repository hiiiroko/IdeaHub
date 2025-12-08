import React, { useEffect, useMemo, useRef, useState } from 'react';

interface MasonryProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateHeight?: (item: T, columnWidth: number) => number;
  responsive?: { base: number; md?: number; lg?: number; xl?: number };
  columnGap?: number;
  className?: string;
}

export function Masonry<T>({
  items,
  renderItem,
  estimateHeight,
  responsive = { base: 2, md: 3, lg: 4 },
  columnGap = 16,
  className = ''
}: MasonryProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [columnCount, setColumnCount] = useState<number>(responsive.base);

  useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth;
      let cols = responsive.base;
      if (responsive.md && w >= 768) cols = responsive.md;
      if (responsive.lg && w >= 1024) cols = responsive.lg;
      if (responsive.xl && w >= 1280) cols = responsive.xl;
      setColumnCount(cols);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [responsive.base, responsive.md, responsive.lg, responsive.xl]);

  const columns = useMemo(() => {
    const containerWidth = containerRef.current?.clientWidth || 0;
    const colWidth = columnCount > 0
      ? (containerWidth - columnGap * (columnCount - 1)) / columnCount
      : containerWidth;

    const cols: { items: { idx: number; node: React.ReactNode }[]; height: number }[] = Array.from({ length: columnCount }, () => ({ items: [], height: 0 }));

    if (items.length === 0 || columnCount === 0) return cols;

    // 先行填充：保证顺位靠前的卡片在首行横向出现
    const firstRow = Math.min(columnCount, items.length);
    for (let i = 0; i < firstRow; i++) {
      const h = estimateHeight ? estimateHeight(items[i], colWidth) : 300;
      cols[i].items.push({ idx: i, node: renderItem(items[i], i) });
      cols[i].height += h;
    }

    // 后续采用最矮列策略，保证瀑布流均衡
    for (let i = firstRow; i < items.length; i++) {
      const h = estimateHeight ? estimateHeight(items[i], colWidth) : 300;
      let target = 0;
      for (let c = 1; c < columnCount; c++) {
        if (cols[c].height < cols[target].height) target = c;
      }
      cols[target].items.push({ idx: i, node: renderItem(items[i], i) });
      cols[target].height += h;
    }

    return cols;
  }, [items, columnCount, columnGap, estimateHeight]);

  return (
    <div ref={containerRef} className={`flex ${className}`} style={{ gap: columnGap }}>
      {columns.map((col, ci) => (
        <div key={ci} className="flex-1 min-w-0 flex flex-col">
          {col.items.map(({ idx, node }) => (
            <div key={idx} style={{ marginBottom: columnGap }}>
              {node}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
