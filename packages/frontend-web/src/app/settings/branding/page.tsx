'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import BrandAssetUpload from '@/components/branding/BrandAssetUpload';

export default function BrandingSettingsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Branding Settings</h1>
          <p className="text-gray-600">
            Upload and manage your stream branding assets
          </p>
        </div>

        <div className="max-w-4xl">
          <BrandAssetUpload />
        </div>

        <div className="mt-8 max-w-4xl p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold mb-2">🎨 Logo Overlay Guide</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
            <li>Use PNG files with transparent backgrounds for best results</li>
            <li>Recommended size: 300x300px to 600x600px</li>
            <li>The logo will automatically scale to fit your stream</li>
            <li>Position and opacity can be adjusted after upload</li>
            <li>Your most recent logo will be used for new streams</li>
          </ul>
        </div>
      </div>
    </ProtectedRoute>
  );
}
