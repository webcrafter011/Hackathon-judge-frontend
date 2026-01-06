import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  validateFileType, 
  validateFileSize, 
  ALLOWED_IMAGE_TYPES,
  formatFileSize 
} from '../../services/assetService';

/**
 * ImageUpload - Reusable image upload component with preview and drag-drop
 * 
 * @param {Object} props
 * @param {string} props.value - Current image URL
 * @param {Function} props.onChange - Called with File when image selected
 * @param {Function} props.onRemove - Called when image removed
 * @param {boolean} props.disabled - Disable the component
 * @param {boolean} props.isUploading - Show uploading state
 * @param {string} props.error - Error message to display
 * @param {string} props.label - Label for the upload area
 * @param {string} props.hint - Helper text
 * @param {number} props.maxSizeMB - Maximum file size in MB
 * @param {string[]} props.allowedTypes - Allowed MIME types
 * @param {string} props.aspectRatio - CSS aspect-ratio value (e.g., '16/9', '1/1')
 * @param {string} props.className - Additional classes
 */
function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  isUploading = false,
  error,
  label = 'Upload Image',
  hint = 'PNG, JPG, GIF up to 5MB',
  maxSizeMB = 5,
  allowedTypes = ALLOWED_IMAGE_TYPES,
  aspectRatio = '16/9',
  className,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [localError, setLocalError] = useState(null);

  // Handle file validation and selection
  const handleFile = useCallback((file) => {
    setLocalError(null);
    
    if (!validateFileType(file, allowedTypes)) {
      setLocalError('Invalid file type. Please upload an image.');
      return;
    }
    
    if (!validateFileSize(file, maxSizeMB)) {
      setLocalError(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    
    onChange?.(file);
  }, [allowedTypes, maxSizeMB, onChange]);

  // Handle file input change
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Handle remove
  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
    onRemove?.();
  };

  // Open file dialog
  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const displayError = error || localError;
  const displayImage = preview || value;

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all cursor-pointer overflow-hidden',
          'hover:border-secondary/50 hover:bg-secondary/5',
          isDragging && 'border-secondary bg-secondary/10',
          displayError && 'border-error',
          disabled && 'opacity-50 cursor-not-allowed',
          !displayImage && 'min-h-[200px]'
        )}
        style={{ aspectRatio: displayImage ? aspectRatio : undefined }}
      >
        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
            </div>
          </div>
        )}

        {/* Image preview */}
        {displayImage ? (
          <div className="relative w-full h-full group">
            <img
              src={displayImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            
            {/* Remove button */}
            {!disabled && !isUploading && (
              <button
                onClick={handleRemove}
                className={cn(
                  'absolute top-2 right-2 p-1.5 rounded-full',
                  'bg-error/90 text-white hover:bg-error',
                  'opacity-0 group-hover:opacity-100 transition-opacity'
                )}
              >
                <X size={16} />
              </button>
            )}

            {/* Change overlay */}
            {!disabled && !isUploading && (
              <div className={cn(
                'absolute inset-0 bg-black/40 flex items-center justify-center',
                'opacity-0 group-hover:opacity-100 transition-opacity'
              )}>
                <span className="text-white font-medium">Click to change</span>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mb-4',
              isDragging ? 'bg-secondary/20' : 'bg-muted'
            )}>
              {isDragging ? (
                <Upload className="w-8 h-8 text-secondary" />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <p className="font-medium text-foreground">{label}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isDragging ? 'Drop your image here' : 'Drag and drop or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{hint}</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {displayError && (
        <div className="flex items-center gap-2 text-sm text-error">
          <AlertCircle size={14} />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
