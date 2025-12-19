'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface BrandAsset {
  id: string;
  type: string;
  fileUrl: string;
  fileName: string;
  settings: {
    position?: string;
    opacity?: number;
    scale?: number;
    padding?: { x: number; y: number };
  };
  createdAt: string;
}

export default function BrandAssetUpload() {
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [position, setPosition] = useState('top-left');
  const [opacity, setOpacity] = useState(0.8);
  const [scale, setScale] = useState(0.15);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const response = await api.get('/users/brand-assets');
      setAssets(response.data);
    } catch (err) {
      console.error('Failed to load brand assets:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'logo');
      formData.append('settings', JSON.stringify({
        position,
        opacity,
        scale,
        padding: { x: 20, y: 20 }
      }));

      await api.post('/users/brand-assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      await loadAssets();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('Delete this logo?')) return;

    try {
      await api.delete(`/users/brand-assets/${id}`);
      await loadAssets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const positionLabels: Record<string, string> = {
    'top-left': 'Top Left',
    'top-right': 'Top Right',
    'bottom-left': 'Bottom Left',
    'bottom-right': 'Bottom Right',
    'center': 'Center'
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Brand Assets</h3>

      {/* Upload Section */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h4 className="font-medium mb-4">Upload Logo</h4>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="mb-4"
        />

        {previewUrl && (
          <div className="space-y-4">
            <div className="relative w-full h-48 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
                style={{ opacity }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  {Object.entries(positionLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Opacity: {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Scale: {Math.round(scale * 100)}%
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </button>
          </div>
        )}
      </div>

      {/* Existing Assets */}
      <div>
        <h4 className="font-medium mb-3">Your Logos</h4>
        {assets.length === 0 ? (
          <p className="text-gray-500 text-sm">No logos uploaded yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="border rounded-lg p-3 bg-white">
                <div className="aspect-square bg-gray-100 rounded flex items-center justify-center mb-2 overflow-hidden">
                  <img
                    src={`http://localhost:3000${asset.fileUrl}`}
                    alt={asset.fileName}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="text-sm truncate mb-2">{asset.fileName}</div>
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                  <span>{positionLabels[asset.settings.position || 'top-left']}</span>
                  <span>{Math.round((asset.settings.opacity || 0.8) * 100)}%</span>
                </div>
                <button
                  onClick={() => deleteAsset(asset.id)}
                  className="w-full px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
