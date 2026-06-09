import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * ScaledSection: A wrapper that renders a fixed-width (1920px) section
 * and scales it down responsively using JavaScript-computed transform.
 */
export function ScaledSection({
  children,
  designWidth = 1920,
  designHeight,
  className = "",
  id,
  style,
}: {
  children: ReactNode;
  designWidth?: number;
  designHeight?: number;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  const innerRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  const [computedHeight, setComputedHeight] = useState(designHeight || 0);

  useEffect(() => {
    const measure = () => {
      const nextScale = Math.min(1, window.innerWidth / designWidth);
      setScale(nextScale);

      if (!designHeight && innerRef.current) {
        setComputedHeight(innerRef.current.scrollHeight);
      }
    };

    measure();
    window.addEventListener("resize", measure);

    const observer =
      typeof ResizeObserver !== "undefined" && innerRef.current
        ? new ResizeObserver(measure)
        : null;

    if (observer && innerRef.current) {
      observer.observe(innerRef.current);
    }

    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [designWidth, designHeight]);

  const effectiveHeight = designHeight || computedHeight;
  const wrapperHeight = effectiveHeight * scale;

  return (
    <div
      id={id}
      className={`w-full hidden xl:block relative ${className}`}
      style={{ height: `${wrapperHeight}px`, overflow: "hidden" }}
    >
      <section
        ref={innerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${designWidth}px`,
          ...(designHeight ? { height: `${designHeight}px` } : {}),
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          ...style,
        }}
      >
        {children}
      </section>
    </div>
  );
}
