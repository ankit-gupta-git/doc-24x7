import React from 'react';

import logoUrl from '../../assets/logo.svg';
import logoWhiteUrl from '../../assets/logo-white.svg';
import markUrl from '../../assets/logo-mark.svg';

/** Doctor 24x7 icon (static SVG): the "24 ×7" dial with a medical cross. */
export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <img src={markUrl} alt="" width={64} height={64} className={className} />
);

interface BrandLogoProps {
  /** 'dark' for dark backgrounds such as the footer. */
  tone?: 'light' | 'dark';
  size?: 'md' | 'lg';
}

/** Full Doctor 24x7 logo (static SVG): icon, name and "Care around the clock". */
export const BrandLogo: React.FC<BrandLogoProps> = ({ tone = 'light', size = 'md' }) => (
  <img
    src={tone === 'dark' ? logoWhiteUrl : logoUrl}
    alt="Doctor 24x7"
    width={244}
    height={64}
    className={`${size === 'lg' ? 'h-14' : 'h-12'} w-auto group-hover:opacity-90 transition-opacity`}
  />
);
