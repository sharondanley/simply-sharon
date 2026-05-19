import { ReactNode, useEffect, useRef, useState } from "react";

export function ScaledPage({
  children,
  width = 1920,
  watchKey,
}: {
  children: ReactNode;
  width?: number;
  watchKey?: unknown;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [bottomCompensation, setBottomCompensation] = useState(0);

  useEffect(() => {
    const measure = () => {
      const contentHeight = innerRef.current?.offsetHeight || 0;
      const nextScale = Math.min(1, window.innerWidth / width);
      const scaledHeight = contentHeight * nextScale;
      setScale(nextScale);
      setBottomCompensation(Math.max(0, contentHeight - scaledHeight));
    };

    measure();
    window.addEventListener("resize", measure);

    const resizeObserver = typeof ResizeObserver !== "undefined" && innerRef.current
      ? new ResizeObserver(measure)
      : null;

    if (resizeObserver && innerRef.current) {
      resizeObserver.observe(innerRef.current);
    }

    return () => {
      window.removeEventListener("resize", measure);
      resizeObserver?.disconnect();
    };
  }, [watchKey, width]);

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <div
        ref={innerRef}
        style={{
          width,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          marginBottom: bottomCompensation > 0 ? `-${bottomCompensation}px` : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
