import React, { useCallback, useRef } from 'react';
import { Upload, Camera, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string, previewUrl: string) => void;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if dimension > 1536 to save tokens/bandwidth, preserving aspect ratio
          // Gemini Flash handles larger inputs, but resizing ensures consistent performance and avoids massive payloads
          const MAX_SIZE = 1536;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            } else {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // White background for transparent PNGs/WebPs converted to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Always convert to JPEG for maximum compatibility with Gemini API
          // This fixes issues with AVIF, HEIC (if browser supports), and other formats
          const newDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64Data = newDataUrl.split(',')[1];
          
          resolve({
            base64: base64Data,
            mimeType: 'image/jpeg',
            previewUrl: newDataUrl
          });
        };
        img.onerror = () => reject(new Error('Failed to load image. The format might not be supported by your browser.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic type validation
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    try {
      // Process the image (convert to JPEG, resize)
      const { base64, mimeType, previewUrl } = await processImage(file);
      onImageSelected(base64, mimeType, previewUrl);
    } catch (error) {
      console.error("Image processing error:", error);
      alert("Could not process this image. Please try a standard format like JPEG or PNG.");
    }
    
    // Reset input so same file can be selected again if needed
    event.target.value = '';
  }, [onImageSelected]);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isLoading}
      />
      
      <div 
        onClick={isLoading ? undefined : triggerUpload}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 sm:p-12
          flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300
          ${isLoading 
            ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed' 
            : 'border-green-200 bg-green-50/50 hover:bg-green-50 hover:border-green-400 hover:shadow-md'
          }
        `}
      >
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          ) : (
            <Upload className="w-8 h-8 text-green-600" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          {isLoading ? "Analyzing..." : "Upload Waste Image"}
        </h3>
        
        <p className="text-slate-500 max-w-xs mx-auto mb-6 text-sm">
          Take a photo or upload an image of any waste item to check its recyclability.
        </p>

        <div className="flex gap-3">
          <button 
            type="button"
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-green-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <ImageIcon className="w-4 h-4" />
            Select File
          </button>
          <button 
             type="button"
             disabled={isLoading}
             className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm shadow-green-200"
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </button>
        </div>
      </div>
    </div>
  );
};
