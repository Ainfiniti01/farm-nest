/**
 * Utility to compress and resize image files before converting to Data URL.
 * Prevents saving multi-megabyte base64 strings into database columns,
 * which cause PostgREST 500 errors and timeout issues.
 */
export const compressImage = (
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If file is already small (< 100KB), read directly
    if (file.size < 100 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

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