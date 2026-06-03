"use client";

import { useMemo } from "react";
import Stickman from "./Stickman";

interface SVGNode {
  tag: string;
  props: Record<string, any>;
  children?: SVGNode[];
}

const DynamicSVGNode = ({ node, isRoot = false }: { node: SVGNode, isRoot?: boolean }) => {
  const Tag = node.tag as any;
  
  const sanitizedProps: Record<string, any> = {};
  for (const key in node.props) {
    if (key === "class") {
      sanitizedProps["className"] = node.props[key];
    } else if (key.includes("-") && !key.startsWith("data-") && !key.startsWith("aria-")) {
      const camelKey = key.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      sanitizedProps[camelKey] = node.props[key];
    } else {
      sanitizedProps[key] = node.props[key];
    }
  }

  if (typeof sanitizedProps.style === "string") {
    const styleObj: Record<string, string> = {};
    sanitizedProps.style.split(";").forEach((pair: string) => {
      const idx = pair.indexOf(":");
      if (idx !== -1) {
        let key = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        if (key && value) {
          if (!key.startsWith("--")) {
            key = key.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
          }
          styleObj[key] = value;
        }
      }
    });
    sanitizedProps.style = styleObj;
  }

  if (isRoot) {
    sanitizedProps.className = (sanitizedProps.className || "") + " animate-[drawSvg_2s_ease-out_forwards]";
    sanitizedProps.style = { ...sanitizedProps.style, strokeDasharray: 1000, strokeDashoffset: 1000 };
  }

  return (
    <Tag {...sanitizedProps}>
      {node.children?.map((child, idx) => (
        <DynamicSVGNode key={idx} node={child} />
      ))}
    </Tag>
  );
};

export default function MnemonicSVG({
  word,
  size = 140,
}: {
  word: {
    svg_elements?: SVGNode[];
    custom_image_url?: string | null;
    custom_svg?: string | null;
    stickmanPose?: string;
    word?: string;
  };
  size?: number;
}) {
  const hasSvgElements = word.svg_elements && Array.isArray(word.svg_elements) && word.svg_elements.length > 0;
  const hasRawSvg = !!word.custom_svg;

  if (hasRawSvg || hasSvgElements) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center overflow-hidden [&_svg]:!w-full [&_svg]:!h-full [&_svg]:!max-w-full [&_svg]:!max-h-full [&_svg]:object-contain group-hover:scale-105 transition-transform duration-500 [&_svg]:animate-[drawSvg_2s_ease-out_forwards] [&_svg]:[stroke-dasharray:1000] [&_svg]:[stroke-dashoffset:1000]" 
      >
        <style jsx global>{`
          @keyframes drawSvg {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
        {hasRawSvg ? (
          <div className="w-full h-full flex items-center justify-center [&_svg]:!w-full [&_svg]:!h-full [&_svg]:!max-w-full [&_svg]:!max-h-full [&_svg]:object-contain" dangerouslySetInnerHTML={{ __html: word.custom_svg! }} />
        ) : (
          word.svg_elements!.map((node, i) => (
            <DynamicSVGNode key={i} node={node} isRoot={true} />
          ))
        )}
      </div>
    );
  }

  if (word.custom_image_url) {
    return (
      <div
        className="w-full h-full rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center"
      >
        <img
          src={word.custom_image_url}
          alt={`Visual mnemonic for ${word.word}`}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
      </div>
    );
  }

  return <Stickman pose={word.stickmanPose || "thinking"} size={size} />;
}
