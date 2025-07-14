
import React, { useState, useEffect } from 'react';
import md5 from 'md5';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  email?: string; // Optional email for Gravatar fallback
  className?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'auto',
  email,
  className = '',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState(false);

  // Generate Gravatar URL as fallback
  const getGravatarUrl = (email: string) => {
    const hash = md5(email.toLowerCase().trim());
    return `https://www.gravatar.com/avatar/${hash}?s=${width || 80}&d=identicon`;
  };

  useEffect(() => {
    setImgSrc(src);
    setError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    setError(true);
    if (email) {
      setImgSrc(getGravatarUrl(email));
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"
          style={{ width, height }}
        />
      )}
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        onError={handleError}
        onLoad={handleLoad}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 rounded-full object-cover ${className}`}
        {...props}
      />
    </div>
  );
};

export default React.memo(OptimizedImage); 
