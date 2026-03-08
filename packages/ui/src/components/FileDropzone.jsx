import { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileAudio, FileVideo, File } from 'lucide-react';
import { cn } from '../lib/cn';

function getFileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a', 'wma'].includes(ext))
    return <FileAudio className="h-5 w-5" />;
  if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext))
    return <FileVideo className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function FileDropzone({
  accept,
  maxSize = 500 * 1024 * 1024,
  multiple = false,
  label = 'Drop files here or click to browse',
  description,
  onFilesSelected,
  onDrop,
  className,
}) {
  const onFiles = onFilesSelected || onDrop;
  const acceptList = accept
    ? Array.isArray(accept) ? accept : accept.split(',').map((s) => s.trim())
    : null;

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFiles = useCallback(
    (files) => {
      setError(null);
      const valid = [];
      for (const file of files) {
        if (file.size > maxSize) {
          setError(`${file.name} exceeds max size (${formatSize(maxSize)})`);
          continue;
        }
        if (acceptList && acceptList.length > 0) {
          const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
          const matchesExt = acceptList.some((a) => a.startsWith('.') && a.toLowerCase() === ext);
          const matchesMime = acceptList.some((a) => !a.startsWith('.') && file.type.match(a));
          if (!matchesExt && !matchesMime) {
            setError(`${file.name} is not a supported format`);
            continue;
          }
        }
        valid.push(file);
      }
      return valid;
    },
    [acceptList, maxSize]
  );

  const handleFiles = useCallback(
    (fileList) => {
      if (!fileList) return;
      const files = Array.from(fileList);
      const valid = validateFiles(files);
      if (valid.length > 0) {
        const selected = multiple ? valid : [valid[0]];
        setSelectedFiles(selected);
        onFiles?.(selected);
      }
    },
    [validateFiles, multiple, onFiles]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (index) => {
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      onFiles?.(next);
      return next;
    });
  };

  return (
    <div className={cn('w-full', className)}>
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors duration-200',
          isDragging
            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
            : 'border-[var(--border-default)] hover:border-[var(--border-hover)] bg-[var(--glass-bg)]'
        )}
      >
        <motion.div animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}>
          <Upload className="h-10 w-10 text-[var(--text-muted)]" />
        </motion.div>
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
          {description && <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptList ? acceptList.join(',') : undefined}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </motion.div>

      {error && <p className="mt-2 text-xs text-[var(--accent-error)]">{error}</p>}

      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            {selectedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]"
              >
                <div className="text-[var(--accent-primary)]">{getFileIcon(file.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{formatSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="p-1 rounded hover:bg-[var(--glass-hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
