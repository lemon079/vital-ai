import fs from 'fs';
import path from 'path';

/**
 * Resolves a given file path or URL to an absolute disk path on the local filesystem.
 * Handles paths starting with `/uploads/`, `\uploads\`, relative paths, or Windows drive roots.
 */
export function resolveAbsoluteFilePath(filePath: string): string {
  if (!filePath || filePath.trim() === '') return '';

  // 1. If it's already an absolute path that exists on disk, return it immediately
  try {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  } catch {
    // Ignore invalid path syntax errors
  }

  // Clean leading slashes/backslashes
  const cleanPath = filePath.replace(/^[/\\]+/, '');

  // 2. Check in process.cwd()/public/cleanPath
  const publicPath = path.join(process.cwd(), 'public', cleanPath);
  if (fs.existsSync(publicPath)) {
    return publicPath;
  }

  // 3. Check if filename exists inside process.cwd()/public/uploads/
  const filename = path.basename(filePath);
  const uploadsFallback = path.join(process.cwd(), 'public', 'uploads', filename);
  if (fs.existsSync(uploadsFallback)) {
    return uploadsFallback;
  }

  // 4. Check in process.cwd()/cleanPath
  const cwdPath = path.join(process.cwd(), cleanPath);
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }

  // 5. Fallback
  return filePath;
}
