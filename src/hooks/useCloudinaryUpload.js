import { toast } from 'sonner';

const CLOUD_NAME = 'dyqjeu5m5';
const UPLOAD_PRESET = 'minimart';
const FOLDER_NAME = 'minimart_uploads';

export function useCloudinaryUpload() {
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', FOLDER_NAME);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.secure_url) {
        toast.success('Upload complete!');
        return data.secure_url;
      } else {
        toast.error(data.error?.message || 'Upload failed');
        return null;
      }
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
      return null;
    }
  };

  return { uploadImage };
}
