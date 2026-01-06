import { useState, useRef } from 'react';
import { Camera, Loader2, User, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  validateFileType, 
  validateFileSize, 
  ALLOWED_IMAGE_TYPES,
  MAX_AVATAR_SIZE_MB 
} from '../../services/assetService';

/**
 * AvatarUpload - Circular avatar upload component with camera overlay
 * 
 * @param {Object} props
 * @param {string} props.value - Current avatar URL
 * @param {Function} props.onChange - Called with File when image selected
 * @param {Function} props.onRemove - Called when avatar removed
 * @param {boolean} props.disabled - Disable the component
 * @param {boolean} props.isUploading - Show uploading state
 * @param {string} props.error - Error message
 * @param {string} props.name - User's name for fallback initials
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg', 'xl'
 * @param {string} props.className - Additional classes
 */
function AvatarUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  isUploading = false,
  error,
  name = '',
  size = 'lg',
  className,
}) {
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState(null);
  const [preview, setPreview] = useState(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  // Get initials from name
  const getInitials = () => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Handle file selection
  const handleFile = (file) => {
    setLocalError(null);
    
    if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
      setLocalError('Please upload an image file (PNG, JPG, GIF, WebP)');
      return;
    }
    
    if (!validateFileSize(file, MAX_AVATAR_SIZE_MB)) {
      setLocalError(`Image too large. Maximum size is ${MAX_AVATAR_SIZE_MB}MB`);
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    
    onChange?.(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
    onRemove?.();
  };

  const displayError = error || localError;
  const displayImage = preview || value;

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Avatar container */}
      <div
        onClick={handleClick}
        className={cn(
          'relative rounded-full overflow-hidden cursor-pointer group',
          'ring-4 ring-background shadow-lg',
          sizeClasses[size],
          disabled && 'opacity-50 cursor-not-allowed',
          displayError && 'ring-error'
        )}
      >
        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {/* Avatar content */}
        {displayImage ? (
          <img
            src={displayImage}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
            {name ? (
              <span className={cn(
                'font-bold text-white',
                size === 'sm' && 'text-lg',
                size === 'md' && 'text-xl',
                size === 'lg' && 'text-2xl',
                size === 'xl' && 'text-3xl'
              )}>
                {getInitials()}
              </span>
            ) : (
              <User className="text-white/70" size={iconSizes[size]} />
            )}
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="text-white animate-spin" size={iconSizes[size]} />
          </div>
        )}

        {/* Hover overlay with camera icon */}
        {!disabled && !isUploading && (
          <div className={cn(
            'absolute inset-0 bg-black/50 flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity'
          )}>
            <Camera className="text-white" size={iconSizes[size]} />
          </div>
        )}

        {/* Remove button for existing image */}
        {displayImage && !disabled && !isUploading && (
          <button
            onClick={handleRemove}
            className={cn(
              'absolute -top-1 -right-1 p-1 rounded-full',
              'bg-error text-white hover:bg-error/90',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'shadow-lg'
            )}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Helper text */}
      <div className="text-center">
        <button
          onClick={handleClick}
          disabled={disabled || isUploading}
          className={cn(
            'text-sm text-secondary hover:text-secondary/80 font-medium',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {displayImage ? 'Change Photo' : 'Upload Photo'}
        </button>
        <p className="text-xs text-muted-foreground mt-1">
          Max {MAX_AVATAR_SIZE_MB}MB
        </p>
      </div>

      {/* Error message */}
      {displayError && (
        <p className="text-sm text-error text-center">{displayError}</p>
      )}
    </div>
  );
}

export default AvatarUpload;
