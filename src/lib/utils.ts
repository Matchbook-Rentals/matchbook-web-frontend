import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a file size in bytes to a human-readable string.
 * @param bytes - The file size in bytes
 * @returns A formatted string representation of the file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Utility function to download a file from a URL
 * @param url - The URL of the file to download
 * @param filename - The name to save the file as
 */
export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Gets the file extension from a filename
 * @param filename - The filename to extract extension from
 * @returns The file extension (without the dot)
 */
export function getFileExtension(filename: string): string {
  return filename.slice((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1);
}

/**
 * Checks if a file is an image based on its extension
 * @param filename - The filename to check
 * @returns True if the file is an image, false otherwise
 */
export function isImageFile(filename: string): boolean {
  const extension = getFileExtension(filename).toLowerCase();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return imageExtensions.includes(extension);
}

/**
 * Checks if a file is a document (PDF, Word, etc.) based on its extension
 * @param filename - The filename to check
 * @returns True if the file is a document, false otherwise
 */
export function isDocumentFile(filename: string): boolean {
  const extension = getFileExtension(filename).toLowerCase();
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'];
  return documentExtensions.includes(extension);
}

/**
 * Gets a file's mime type based on its extension
 * @param filename - The filename to check
 * @returns The mime type or 'application/octet-stream' if unknown
 */
export function getFileMimeType(filename: string): string {
  const extension = getFileExtension(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'wav': 'audio/wav',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Gets the appropriate file icon based on the file type
 * @param filename - The filename to determine icon for
 * @returns The name of the icon to use
 */
export function getFileIcon(filename: string): string {
  const extension = getFileExtension(filename).toLowerCase();
  
  // Return specific icons based on file type
  switch (extension) {
    case 'pdf':
      return 'FileText';
    case 'doc':
    case 'docx':
      return 'FileText';
    case 'xls':
    case 'xlsx':
    case 'csv':
      return 'FileSpreadsheet';
    case 'ppt':
    case 'pptx':
      return 'FilePresentation';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return 'FileImage';
    case 'mp3':
    case 'wav':
      return 'FileAudio';
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'FileVideo';
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
      return 'FileArchive';
    default:
      return 'File';
  }
}

/**
 * Constructs the CDN URL for a file by its key
 * @param fileKey - The file key from UploadThing
 * @returns The CDN URL for the file
 */
export function getFileUrl(fileKey: string): string {
  const appId = process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID || '';
  // If we have an app ID, use the new URL format, otherwise fall back to the old one
  return appId 
    ? `https://${appId}.ufs.sh/f/${fileKey}` 
    : `https://utfs.io/f/${fileKey}`;
}
