// ImageKit Configuration
const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '';
const IMAGEKIT_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '';
const IMAGEKIT_AUTH_ENDPOINT = import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT || 'http://localhost:3001/api/imagekit/auth';
const IMAGEKIT_UPLOAD_ENDPOINT = import.meta.env.VITE_IMAGEKIT_UPLOAD_ENDPOINT || 'http://localhost:3001/api/imagekit/upload';

export interface UploadResponse {
  url: string;
  fileId: string;
  name: string;
}

interface AuthResponse {
  token: string;
  expire: number;
  signature: string;
}

/**
 * Get authentication parameters from server
 * Requires Firebase auth token to be passed
 */
const getAuthParams = async (getIdToken: () => Promise<string>): Promise<AuthResponse> => {
  const token = await getIdToken();
  const response = await fetch(IMAGEKIT_AUTH_ENDPOINT, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to get ImageKit auth parameters');
  }
  return response.json();
};

/**
 * Upload an image file to ImageKit via server (to bypass CORS)
 * @param file - The file to upload
 * @param fileName - Optional custom file name
 * @param getIdToken - Function to get Firebase ID token
 * @returns Promise with upload response containing URL and file details
 */
export const uploadImage = async (
  file: File,
  fileName?: string,
  getIdToken?: () => Promise<string>
): Promise<UploadResponse> => {
  try {
    // Get Firebase auth token
    if (!getIdToken) {
      throw new Error('Authentication required to upload images');
    }
    const token = await getIdToken();

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName || file.name);

    // Upload via server endpoint (bypasses CORS issues)
    const response = await fetch(IMAGEKIT_UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[ImageKit] Upload failed:', error);
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();

    return {
      url: data.url,
      fileId: data.fileId,
      name: data.name,
    };
  } catch (error) {
    console.error('[ImageKit] Upload error:', error);
    throw new Error('Failed to upload image to ImageKit');
  }
};

/**
 * Delete an image from ImageKit
 * @param fileId - The ImageKit file ID to delete
 */
export const deleteImage = async (fileId: string): Promise<void> => {
  try {
    // This should be implemented as a server-side endpoint for security
    console.warn('[ImageKit] Delete functionality should be implemented server-side');
    throw new Error('Delete functionality not implemented');
  } catch (error) {
    console.error('[ImageKit] Delete error:', error);
    throw new Error('Failed to delete image from ImageKit');
  }
};

