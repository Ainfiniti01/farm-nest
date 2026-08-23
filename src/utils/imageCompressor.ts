import { supabase } from "@/lib/supabaseClient";

/**
 * Utility to compress and resize image files before uploading or fallback.
 */
export const compressImage = (
  file: File | Blob,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.75
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
 * Converts a base64 Data URL string to a standard binary Blob.
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Uploads a File or Blob to Supabase Storage 'farm-gallery' and returns its public URL.
 * Automatically compresses large images first to minimize storage footprint.
 */
export const uploadImageToStorage = async (
  fileOrBlob: File | Blob,
  userId?: string,
  folder = "animals"
): Promise<string> => {
  try {
    let blobToUpload = fileOrBlob;

    // Pre-compress File to max 1000x1000 JPEG if needed
    if (fileOrBlob instanceof File && fileOrBlob.size > 200 * 1024) {
      try {
        const compressed = await compressImage(fileOrBlob, 1000, 1000, 0.75);
        blobToUpload = dataUrlToBlob(compressed);
      } catch {
        blobToUpload = fileOrBlob;
      }
    }

    const safeUserId = userId || "anonymous";
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
    const filePath = `${folder}/${safeUserId}/${filename}`;

    const { data, error } = await supabase.storage
      .from("farm-gallery")
      .upload(filePath, blobToUpload, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
        upsert: true,
      });

    if (error) {
      console.warn("[uploadImageToStorage] Storage upload warning:", error);
      if (fileOrBlob instanceof File) {
        return await compressImage(fileOrBlob, 400, 400, 0.6);
      }
      return "/placeholder.svg";
    }

    const { data: publicData } = supabase.storage
      .from("farm-gallery")
      .getPublicUrl(data.path);

    return publicData?.publicUrl || "/placeholder.svg";
  } catch (err) {
    console.error("[uploadImageToStorage] Upload error:", err);
    return "/placeholder.svg";
  }
};

/**
 * Ensures any image reference (file, dataUrl, or url) is stored in Supabase Storage.
 * Returns the public Storage URL or existing URL.
 */
export const ensureStorageUrl = async (
  urlOrBase64?: string,
  userId?: string,
  folder = "animals"
): Promise<string> => {
  if (!urlOrBase64 || urlOrBase64 === "/placeholder.svg") {
    return "/placeholder.svg";
  }

  // Already a hosted URL
  if (urlOrBase64.startsWith("http://") || urlOrBase64.startsWith("https://")) {
    return urlOrBase64;
  }

  // If it is a base64 Data URL, upload to Supabase Storage immediately
  if (urlOrBase64.startsWith("data:image/")) {
    try {
      const blob = dataUrlToBlob(urlOrBase64);
      return await uploadImageToStorage(blob, userId, folder);
    } catch (err) {
      console.warn("[ensureStorageUrl] Failed to upload base64 image:", err);
      return urlOrBase64;
    }
  }

  return urlOrBase64;
};

/**
 * Uploads an image file or compressed dataUrl to Supabase storage 'farm-gallery' bucket.
 * Returns public URL if successful.
 */
export const uploadOrCompressImage = async (
  file: File,
  userId?: string,
  _supabaseClient?: any
): Promise<string> => {
  return await uploadImageToStorage(file, userId, "animals");
};