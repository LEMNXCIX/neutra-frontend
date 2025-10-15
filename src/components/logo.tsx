import React from 'react';

export default function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  const stroke = "currentColor";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="4" y="4" width="56" height="56" rx="12" fill="currentColor" opacity="0.08" />
      <path d="M16 42 C22 26, 42 22, 48 10" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="4" fill={stroke} />
    </svg>
  );
}
