"use client";

import React, { useState, CSSProperties, MouseEvent } from "react";

interface InteractiveFolderProps {
  color?: string;
  scale?: number;
  items?: React.ReactNode[];
  className?: string;
}

const adjustHexBrightness = (hex: string, amount: number): string => {
  let s = hex.startsWith("#") ? hex.slice(1) : hex;
  if (s.length === 3) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const n = parseInt(s, 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - amount))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - amount))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - amount))));
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
};

const InteractiveFolder: React.FC<InteractiveFolderProps> = ({
  color = "#00d8ff",
  scale = 1,
  items = [],
  className = "",
}) => {
  const maxItems = 3;
  let displayedItems = items.slice(0, maxItems);
  while (displayedItems.length < maxItems) {
    displayedItems.push(null);
  }
  const [isOpen, setIsOpen] = useState(false);
  const [itemOffsets, setItemOffsets] = useState<{ x: number; y: number }[]>(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 }))
  );
  const folderBackColor = adjustHexBrightness(color, 0.08);
  const paperColor1 = adjustHexBrightness("#ffffff", 0.1);
  const paperColor2 = adjustHexBrightness("#ffffff", 0.05);
  const paperColor3 = "#ffffff";
  const handleFolderClick = () => {
    setIsOpen((prev) => !prev);
    if (isOpen) {
      setItemOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
    }
  };
  const handleItemMouseMove = (
    e: MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    if (!isOpen) return;
    const itemRect = e.currentTarget.getBoundingClientRect();
    const centerX = itemRect.left + itemRect.width / 2;
    const centerY = itemRect.top + itemRect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setItemOffsets((currentOffsets) => {
      const updatedOffsets = [...currentOffsets];
      updatedOffsets[index] = { x: offsetX, y: offsetY };
      return updatedOffsets;
    });
  };
  const handleItemMouseLeave = (
    e: MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    setItemOffsets((currentOffsets) => {
      const updatedOffsets = [...currentOffsets];
      updatedOffsets[index] = { x: 0, y: 0 };
      return updatedOffsets;
    });
  };
  const folderStyles: CSSProperties = {
    "--main-component-color": color,
    "--back-component-color": folderBackColor,
    "--piece-color-1": paperColor1,
    "--piece-color-2": paperColor2,
    "--piece-color-3": paperColor3,
  } as CSSProperties;
  const scaleStyle = { transform: `scale(${scale})` };
  const getOpenItemTransform = (itemIndex: number) => {
    if (itemIndex === 0) return "translate(-120%, -70%) rotate(-15deg)";
    if (itemIndex === 1) return "translate(10%, -70%) rotate(15deg)";
    if (itemIndex === 2) return "translate(-50%, -100%) rotate(5deg)";
    return "";
  };
  return (
    <div style={scaleStyle} className={`bg-[var(--features-card-bg)] ${className}`}>
      <div
        className={`group relative transition-all duration-200 ease-in cursor-pointer ${
          !isOpen ? "hover:-translate-y-2" : ""
        }`}
        style={{
          ...folderStyles,
          transform: isOpen ? "translateY(-8px)" : undefined,
        }}
        onClick={handleFolderClick}
      >
        <div
          className="relative w-[100px] h-[80px] rounded-tl-0 rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px]"
          style={{ backgroundColor: folderBackColor }}
        >
          <span
            className="absolute z-0 bottom-[98%] left-0 w-[30px] h-[10px] rounded-tl-[5px] rounded-tr-[5px] rounded-bl-0 rounded-br-0"
            style={{ backgroundColor: folderBackColor }}
          ></span>
          {displayedItems.map((item, index) => {
            let itemSizeClasses = "";
            if (index === 0) itemSizeClasses = isOpen ? "w-[70%] h-[80%]" : "w-[70%] h-[80%]";
            if (index === 1) itemSizeClasses = isOpen ? "w-[80%] h-[80%]" : "w-[80%] h-[70%]";
            if (index === 2) itemSizeClasses = isOpen ? "w-[90%] h-[80%]" : "w-[90%] h-[60%]";
            const itemTransformStyle = isOpen
              ? `${getOpenItemTransform(index)} translate(${itemOffsets[index].x}px, ${itemOffsets[index].y}px)`
              : undefined;
            return (
              <div
                key={index}
                onMouseMove={(e) => handleItemMouseMove(e, index)}
                onMouseLeave={(e) => handleItemMouseLeave(e, index)}
                className={`absolute z-20 bottom-[10%] left-1/2 transition-all duration-300 ease-in-out ${
                  !isOpen
                    ? "transform -translate-x-1/2 translate-y-[10%] group-hover:translate-y-0"
                    : "hover:scale-110"
                } ${itemSizeClasses}`}
                style={{
                  ...(!isOpen ? {} : { transform: itemTransformStyle }),
                  backgroundColor: index === 0 ? paperColor1 : index === 1 ? paperColor2 : paperColor3,
                  borderRadius: "10px",
                }}
              >
                {item}
              </div>
            );
          })}
          <div
            className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${
              !isOpen ? "group-hover:[transform:skew(15deg)_scaleY(0.6)]" : ""
            }`}
            style={{
              backgroundColor: color,
              borderRadius: "5px 10px 10px 10px",
              ...(isOpen && { transform: "skew(15deg) scaleY(0.6)" }),
            }}
          ></div>
          <div
            className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${
              !isOpen ? "group-hover:[transform:skew(-15deg)_scaleY(0.6)]" : ""
            }`}
            style={{
              backgroundColor: color,
              borderRadius: "5px 10px 10px 10px",
              ...(isOpen && { transform: "skew(-15deg) scaleY(0.6)" }),
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveFolder;
