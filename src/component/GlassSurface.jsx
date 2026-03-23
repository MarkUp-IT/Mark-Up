"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useId,
  useImperativeHandle,
} from "react";

/* eslint-disable react-hooks/exhaustive-deps */

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handler = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isDark;
};

const GlassSurface = forwardRef(
  (
    {
      children,
      width = 200,
      height = 80,
      borderRadius = 20,
      borderWidth = 1,
      brightness = 50,
      opacity = 0.93,
      blur = 11,
      displace = 5,
      backgroundOpacity = 0.3,
      saturation = 1,
      distortionScale = 0,
      redOffset = 0,
      greenOffset = 10,
      blueOffset = 20,
      xChannel = "R",
      yChannel = "G",
      mixBlendMode = "difference",
      className = "",
      style = {},
      ...props // Menangkap sisa props agar tidak bocor ke DOM
    },
    ref,
  ) => {
    const uniqueId = useId().replace(/:/g, "-");
    const filterId = `glass-filter-${uniqueId}`;
    const redGradId = `red-grad-${uniqueId}`;
    const blueGradId = `blue-grad-${uniqueId}`;

    const [svgSupported, setSvgSupported] = useState(false);

    // Perbaikan: Hapus syntax TypeScript (HTMLDivElement) jika ini file .js/.jsx
    const containerRef = useRef(null);
    const feImageRef = useRef(null);
    const redChannelRef = useRef(null);
    const greenChannelRef = useRef(null);
    const blueChannelRef = useRef(null);
    const gaussianBlurRef = useRef(null);

    // Meneruskan ref dari parent ke containerRef internal
    useImperativeHandle(ref, () => containerRef.current);

    const isDarkMode = useDarkMode();

    const generateDisplacementMap = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const actualWidth =
        rect?.width || (typeof width === "number" ? width : 400);
      const actualHeight =
        rect?.height || (typeof height === "number" ? height : 200);
      const edgeSize =
        Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);

      const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `;

      return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
    };

    const updateDisplacementMap = () => {
      if (feImageRef.current) {
        feImageRef.current.setAttribute("href", generateDisplacementMap());
      }
    };

    useEffect(() => {
      updateDisplacementMap();
      [
        { ref: redChannelRef, offset: redOffset },
        { ref: greenChannelRef, offset: greenOffset },
        { ref: blueChannelRef, offset: blueOffset },
      ].forEach(({ ref: r, offset }) => {
        if (r.current) {
          r.current.setAttribute(
            "scale",
            (distortionScale + offset).toString(),
          );
          r.current.setAttribute("xChannelSelector", xChannel);
          r.current.setAttribute("yChannelSelector", yChannel);
        }
      });

      if (gaussianBlurRef.current) {
        gaussianBlurRef.current.setAttribute(
          "stdDeviation",
          displace.toString(),
        );
      }
    }, [
      width,
      height,
      borderRadius,
      borderWidth,
      brightness,
      opacity,
      blur,
      displace,
      distortionScale,
      redOffset,
      greenOffset,
      blueOffset,
      xChannel,
      yChannel,
      mixBlendMode,
    ]);

    useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(updateDisplacementMap);
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
      setSvgSupported(supportsSVGFilters());
    }, []);

    const supportsSVGFilters = () => {
      if (typeof window === "undefined" || typeof document === "undefined")
        return false;
      const isWebkit =
        /Safari/.test(navigator.userAgent) &&
        !/Chrome/.test(navigator.userAgent);
      const isFirefox = /Firefox/.test(navigator.userAgent);
      if (isWebkit || isFirefox) return false;

      const div = document.createElement("div");
      div.style.backdropFilter = `url(#${filterId})`;
      return div.style.backdropFilter !== "";
    };

    const supportsBackdropFilter = () => {
      if (typeof window === "undefined") return false;
      return CSS.supports("backdrop-filter", "blur(10px)");
    };

    const getContainerStyles = () => {
      const baseStyles = {
        ...style,
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: `${borderRadius}px`,
      };

      const backdropFilterSupported = supportsBackdropFilter();

      if (svgSupported) {
        return {
          ...baseStyles,
          background: isDarkMode
            ? `hsl(0 0% 0% / ${backgroundOpacity})`
            : `hsl(0 0% 100% / ${backgroundOpacity})`,
          backdropFilter: `url(#${filterId}) saturate(${saturation})`,
          boxShadow: isDarkMode
            ? `0 0 2px 1px rgba(255,255,255,0.1) inset, 0px 4px 16px rgba(0,0,0,0.2)`
            : `0 0 2px 1px rgba(0,0,0,0.05) inset, 0px 4px 16px rgba(0,0,0,0.05)`,
        };
      } else {
        const isDarkTheme = isDarkMode;
        if (!backdropFilterSupported) {
          return {
            ...baseStyles,
            background: isDarkTheme
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          };
        }
        return {
          ...baseStyles,
          background: isDarkTheme
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(12px) saturate(1.8)",
          WebkitBackdropFilter: "blur(12px) saturate(1.8)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        };
      }
    };

    return (
      <div
        ref={containerRef}
        className={`relative flex items-center justify-center overflow-hidden transition-opacity duration-[260ms] ease-out ${className}`}
        style={getContainerStyles()}
        {...props} // Penting: Menyalurkan sisa props yang valid (seperti onMouseEnter, dll)
      >
        <svg
          className="w-full h-full pointer-events-none absolute inset-0 opacity-0 -z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter
              id={filterId}
              colorInterpolationFilters="sRGB"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
            >
              <feImage
                ref={feImageRef}
                x="0"
                y="0"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                result="map"
              />
              <feDisplacementMap
                ref={redChannelRef}
                in="SourceGraphic"
                in2="map"
                result="dispRed"
              />
              <feColorMatrix
                in="dispRed"
                type="matrix"
                values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
                result="red"
              />
              <feDisplacementMap
                ref={greenChannelRef}
                in="SourceGraphic"
                in2="map"
                result="dispGreen"
              />
              <feColorMatrix
                in="dispGreen"
                type="matrix"
                values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
                result="green"
              />
              <feDisplacementMap
                ref={blueChannelRef}
                in="SourceGraphic"
                in2="map"
                result="dispBlue"
              />
              <feColorMatrix
                in="dispBlue"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
                result="blue"
              />
              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              <feGaussianBlur
                ref={gaussianBlurRef}
                in="output"
                stdDeviation="0.7"
              />
            </filter>
          </defs>
        </svg>
        <div className="w-full h-full flex items-center justify-between rounded-[inherit] relative z-10">
          {children}
        </div>
      </div>
    );
  },
);

GlassSurface.displayName = "GlassSurface";

export default GlassSurface;
