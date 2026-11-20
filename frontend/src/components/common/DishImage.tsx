import { useEffect, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface DishImageProps {
  src?: string;
  alt: string;
  className?: string;
  iconSizeClass?: string;
}

export function DishImage({
  src,
  alt,
  className = 'h-full w-full',
  iconSizeClass = 'h-6 w-6',
}: DishImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        aria-label={alt}
        className={`${className} flex flex-col items-center justify-center bg-gradient-to-br from-[#F5EFEA] to-[#EAE3DA] text-[#9A7B67]`}
      >
        <UtensilsCrossed className={iconSizeClass} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} object-cover bg-[#F2EFEA]`}
    />
  );
}
