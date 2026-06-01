"use client";

import React from "react";

export default function Logo({ className = "w-40 h-14", hideText = false }: { className?: string; hideText?: boolean }) {
  return (
    <svg viewBox={hideText ? "0 0 120 120" : "0 0 350 120"} className={className} xmlns="http://www.w3.org/2000/svg">
      <g stroke="#E04B35" strokeWidth="2.5" strokeLinecap="round">
        <path d="M 50 40 L 40 30" strokeDasharray="20" strokeDashoffset="20">
          <animate attributeName="stroke-dashoffset" values="20; 20; 20; -20; -20" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M 60 35 L 60 20" strokeDasharray="20" strokeDashoffset="20">
          <animate attributeName="stroke-dashoffset" values="20; 20; 20; -20; -20" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M 70 40 L 80 30" strokeDasharray="20" strokeDashoffset="20">
          <animate attributeName="stroke-dashoffset" values="20; 20; 20; -20; -20" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" />
        </path>
      </g>
      <path d="M 16 35 L 60 102 L 104 35" fill="none" stroke="#F5F5F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
        <animate attributeName="d" values="M 16 35 L 60 102 L 104 35; M 16 35 L 60 102 L 104 35; M 4 55 L 60 110 L 116 55; M 16 35 L 60 102 L 104 35; M 16 35 L 60 102 L 104 35" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
      </path>
      <path d="M 24 35 L 60 92 L 96 35" fill="none" stroke="#F5F5F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        <animate attributeName="d" values="M 24 35 L 60 92 L 96 35; M 24 35 L 60 92 L 96 35; M 10 50 L 60 100 L 110 50; M 24 35 L 60 92 L 96 35; M 24 35 L 60 92 L 96 35" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
      </path>
      <path d="M 34 35 L 60 80 L 86 35" fill="none" stroke="#F5F5F7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="d" values="M 34 35 L 60 80 L 86 35; M 34 35 L 60 80 L 86 35; M 16 45 L 60 90 L 104 45; M 34 35 L 60 80 L 86 35; M 34 35 L 60 80 L 86 35" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
      </path>
      <circle cx="60" cy="48" r="10" fill="#E04B35">
        <animate attributeName="cy" values="48; 20; 65; 48; 48" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 0.58 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
      </circle>
      {!hideText && (
        <text x="125" y="74" fill="#F5F5F7" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="36" letterSpacing="-1">VocabPod</text>
      )}
    </svg>
  );
}
