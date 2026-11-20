import { useState } from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  decorative?: boolean;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'BV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserAvatar({
  name,
  avatarUrl,
  size = 'md',
  decorative = false,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = SIZE_CLASSES[size];

  if (!avatarUrl || imageError) {
    return (
      <div
        aria-hidden="true"
        className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full bg-[#F2EFEA] font-semibold text-[#9A3D18] border border-[#E6E2DC]`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={decorative ? '' : `Ảnh đại diện của ${name}`}
      aria-hidden={decorative ? true : undefined}
      referrerPolicy="no-referrer"
      onError={() => setImageError(true)}
      className={`${sizeClass} shrink-0 rounded-full object-cover border border-[#E6E2DC] bg-[#F2EFEA]`}
    />
  );
}
