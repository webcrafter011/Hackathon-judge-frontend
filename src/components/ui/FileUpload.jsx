import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  X, 
  File, 
  FileText, 
  FileImage, 
  FileVideo, 
  FileArchive,
  FileCode,
  Loader2, 
  AlertCircle,
  Download,
  Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  validateFileType, 
  validateFileSize,
  formatFileSize,
  getCategoryFromMimeType,
  getAssetDownloadUrl,
  ALLOWED_SUBMISSION_TYPES
} from '../../services/assetService';
import Button from './Button';

// Get icon for file category
const getFileIcon = (category) => {
  const icons = {
    image: FileImage,
    document: FileText,
    video: FileVideo,
    archive: FileArchive,
    code: FileCode,
    other: File,
  };
  return icons[category] || File;
};

/**
 * FileItem - Single file display component
 */
function FileItem({ 
  file, 
  asset, 
  onRemove, 
  isUploading = false,
  disabled = false 
}) {
  const isAsset = !!asset;
  const name = asset?.filename || file?.name || 'Unknown file';
  const size = asset?.sizeBytes || file?.size || 0;
  const mimeType = asset?.mimeType || file?.type || '';
  const category = getCategoryFromMimeType(mimeType);
  const Icon = getFileIcon(category);

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30',
      isUploading && 'opacity-60'
    )}>
      {/* File icon */}
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
        category === 'image' && 'bg-success/10 text-success',
        category === 'document' && 'bg-info/10 text-info',
        category === 'video' && 'bg-warning/10 text-warning',
        category === 'archive' && 'bg-secondary/10 text-secondary',
        category === 'code' && 'bg-purple-100 text-purple-600',
        category === 'other' && 'bg-muted text-muted-foreground'
      )}>
        <Icon size={20} />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(size)}
          {mimeType && ` • ${mimeType.split('/')[1]?.toUpperCase() || mimeType}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isUploading ? (
          <Loader2 size={18} className="animate-spin text-secondary" />
        ) : (
          <>
            {/* Download button for existing assets */}
            {isAsset && asset._id && (
              <a
                href={getAssetDownloadUrl(asset._id)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={16} />
              </a>
            )}
            
            {/* Remove button */}
            {!disabled && onRemove && (
              <button
                onClick={onRemove}
                className="p-1.5 rounded hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * FileUpload - Reusable multi-file upload component
 * 
 * @param {Object} props
 * @param {Object[]} props.files - Array of File objects (pending uploads)
 * @param {Object[]} props.assets - Array of existing asset objects
 * @param {Function} props.onFilesChange - Called with File[] when files selected
 * @param {Function} props.onRemoveFile - Called with index when pending file removed
 * @param {Function} props.onRemoveAsset - Called with asset._id when existing asset removed
 * @param {boolean} props.disabled - Disable the component
 * @param {boolean} props.isUploading - Show uploading state
 * @param {string} props.error - Error message
 * @param {string} props.label - Label for the upload area
 * @param {string} props.hint - Helper text
 * @param {number} props.maxSizeMB - Maximum file size per file in MB
 * @param {number} props.maxFiles - Maximum number of files
 * @param {string[]} props.allowedTypes - Allowed MIME types
 * @param {boolean} props.multiple - Allow multiple file selection
 * @param {string} props.className - Additional classes
 */
function FileUpload({
  files = [],
  assets = [],
  onFilesChange,
  onRemoveFile,
  onRemoveAsset,
  disabled = false,
  isUploading = false,
  error,
  label = 'Upload Files',
  hint = 'Drag and drop files here',
  maxSizeMB = 50,
  maxFiles = 10,
  allowedTypes = ALLOWED_SUBMISSION_TYPES,
  multiple = true,
  className,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState(null);

  const totalCount = files.length + assets.length;
  const canAddMore = totalCount < maxFiles;

  // Handle file validation and selection
  const handleFiles = useCallback((newFiles) => {
    setLocalError(null);
    
    // Check max files
    const remaining = maxFiles - totalCount;
    if (newFiles.length > remaining) {
      setLocalError(`You can only add ${remaining} more file(s). Maximum is ${maxFiles}.`);
      newFiles = newFiles.slice(0, remaining);
    }
    
    // Validate each file
    const validFiles = [];
    for (const file of newFiles) {
      if (!validateFileType(file, allowedTypes)) {
        setLocalError(`"${file.name}" has an invalid file type.`);
        continue;
      }
      
      if (!validateFileSize(file, maxSizeMB)) {
        setLocalError(`"${file.name}" is too large. Maximum size is ${maxSizeMB}MB.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      onFilesChange?.(validFiles);
    }
  }, [allowedTypes, maxSizeMB, maxFiles, totalCount, onFilesChange]);

  // Handle file input change
  const handleInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) handleFiles(selectedFiles);
    // Reset input to allow selecting the same file again
    if (inputRef.current) inputRef.current.value = '';
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && canAddMore) setIsDragging(true);
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
    
    if (disabled || !canAddMore) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) handleFiles(droppedFiles);
  };

  // Open file dialog
  const handleClick = () => {
    if (!disabled && canAddMore && !isUploading) {
      inputRef.current?.click();
    }
  };

  const displayError = error || localError;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer',
          'hover:border-secondary/50 hover:bg-secondary/5',
          isDragging && 'border-secondary bg-secondary/10',
          displayError && 'border-error',
          (disabled || !canAddMore) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleInputChange}
          disabled={disabled || !canAddMore || isUploading}
          multiple={multiple}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center mb-3',
            isDragging ? 'bg-secondary/20' : 'bg-muted'
          )}>
            <Upload className={cn(
              'w-6 h-6',
              isDragging ? 'text-secondary' : 'text-muted-foreground'
            )} />
          </div>
          
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isDragging ? 'Drop files here' : hint}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Max {maxSizeMB}MB per file • {totalCount}/{maxFiles} files
          </p>
        </div>
      </div>

      {/* Error message */}
      {displayError && (
        <div className="flex items-center gap-2 text-sm text-error">
          <AlertCircle size={14} />
          <span>{displayError}</span>
        </div>
      )}

      {/* Existing assets */}
      {assets.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Uploaded Files</p>
          <div className="space-y-2">
            {assets.map((asset) => (
              <FileItem
                key={asset._id}
                asset={asset}
                onRemove={() => onRemoveAsset?.(asset._id)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {isUploading ? 'Uploading...' : 'Ready to Upload'}
          </p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <FileItem
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => onRemoveFile?.(index)}
                isUploading={isUploading}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
