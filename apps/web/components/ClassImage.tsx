import Image from 'next/image';
import { classImage } from '@sanctuary-hub/types';

interface ClassImageProps {
  className: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  imgClassName?: string;
}

/**
 * Class portrait sourced from R2. Real D4 art (PNG) lives at
 * https://pub-XXXX.r2.dev/classes/{class}.png — original images from
 * sunderarmor.com/DIABLO4/Classes/2.
 */
export function ClassImage({
  className: d4Class,
  width = 400,
  height = 600,
  fill = false,
  priority = false,
  imgClassName = '',
}: ClassImageProps) {
  const src = classImage(d4Class);
  if (fill) {
    return (
      <Image
        src={src}
        alt={`${d4Class} class art`}
        fill
        priority={priority}
        className={`object-cover object-top ${imgClassName}`}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={`${d4Class} class art`}
      width={width}
      height={height}
      priority={priority}
      className={imgClassName}
    />
  );
}
