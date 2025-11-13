'use client';

import React from 'react';

type LogThumbnailProps = {
  src?: string;
  alt?: string;
  size?: number;
  onClick?: () => void;
};

export default function LogThumbnail({
  src,
  alt = 'Log photo',
  size = 64,
  onClick,
}: LogThumbnailProps) {
  const fallback = '/no-preview.png';

  return (
    <img
      src={src || fallback}
      alt={alt}
      width={size}
      height={size}
      className="rounded border cursor-pointer object-cover"
      style={{ width: size, height: size }}
      onClick={onClick}
      onError={(e) => {
        e.currentTarget.src = fallback;
      }}
    />
  );
}
