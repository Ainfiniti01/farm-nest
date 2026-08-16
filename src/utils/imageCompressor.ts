/**
 * Utility to compress and resize image files before converting to Data URL.
 * Prevents saving multi-megabyte base64 strings into database columns,
 * which cause PostgREST 500 errors and timeout issues.
 */
export const compressImage = (
  file: File,
  maxWidth = 500,
  maxHeight = 500,
  quality = 0.6
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      const src = event.target?.result as string;
      if (!src) {
        reject(new Error("Empty image source"));
        return;
      }
      img.src = src;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export compressed JPEG
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Uploads an image file or compressed dataUrl to Supabase storage 'farm-gallery' bucket.
 * Returns public URL if successful, otherwise returns compressed data URL fallback.
 */
export const uploadOrCompressImage = async (
  file: File,
  userId?: string,
  supabaseClient?: any
): Promise<string> => {
  if (supabaseClient && userId) {
    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `animals/${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const { data, error } = await supabaseClient.storage
        .from("farm-gallery")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (!error && data?.path) {
        const { data: pubData } = supabaseClient.storage
          .from("farm-gallery")
          .getPublicUrl(data.path);
        if (pubData?.publicUrl) {
          return pubData.publicUrl;
        }
      }
    } catch (e) {
      console.warn("[uploadOrCompressImage] Storage upload fallback to compressed base64", e);
    }
  }

  // Fallback to compressed base64 under 50KB
  return await compressImage(file, 500, 500, 0.6);
};