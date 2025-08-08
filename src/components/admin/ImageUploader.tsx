import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useChapter } from '../../contexts/ChapterContext';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  placeholder = 'Drag and drop an image here or click to browse',
  maxSizeMB = 10,
  disabled = false
}: ImageUploaderProps) {
  const { selectedChapter } = useChapter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const storage = getStorage();
      const chapterSlug = selectedChapter?.slug || selectedChapter?.name || 'general';
      const timestamp = Date.now();
      const slugifiedName = slugify(file.name.split('.')[0]);
      const extension = file.name.split('.').pop();
      const storagePath = `breakdowns/${slugify(chapterSlug)}/${timestamp}-${slugifiedName}.${extension}`;
      
      console.log('Uploading to path:', storagePath);
      
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(prog));
        },
        (error) => {
          console.error('Upload error:', error);
          if (error.code === 'storage/unauthorized') {
            setError('Permission denied. Please deploy the storage rules or update them in Firebase Console.');
          } else {
            setError(`Upload failed: ${error.message || 'Please try again.'}`);
          }
          setUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onChange(downloadURL);
            setUploading(false);
            setProgress(100);
          } catch (err) {
            console.error('Failed to get download URL:', err);
            setError('Failed to get image URL. Please try again.');
            setUploading(false);
          }
        }
      );
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please check your permissions.');
      setUploading(false);
    }
  }, [maxSizeMB, onChange, selectedChapter]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [disabled, uploading, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setDragActive(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    onChange('');
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleReplace = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-2">
      {!value ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-all duration-200
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />
          
          <div className="flex flex-col items-center">
            {uploading ? (
              <>
                <div className="w-12 h-12 mb-4 relative">
                  <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                  <div 
                    className="absolute inset-0 border-4 border-blue-500 rounded-full transition-all duration-300"
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${progress > 25 ? '100% 0%' : `${50 + progress * 2}% 0%`}, ${progress > 25 ? (progress > 50 ? '100% 100%' : `100% ${(progress - 25) * 4}%`) : '50% 50%'}, ${progress > 50 ? (progress > 75 ? '0% 100%' : `${100 - (progress - 50) * 4}% 100%`) : '50% 50%'}, ${progress > 75 ? `0% ${100 - (progress - 75) * 4}%` : '50% 50%'})`
                    }}
                  ></div>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">{progress}%</span>
                </div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">{placeholder}</p>
                <p className="text-xs text-gray-500 mt-1">Max file size: {maxSizeMB}MB</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <img
                src={value}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E';
                }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-2">Image uploaded successfully</p>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleReplace}
                  disabled={disabled || uploading}
                  className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled || uploading}
                  className="inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
