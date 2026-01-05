import { FileType, UploadedFile } from '../types';

export const getFileType = (file: File): FileType => {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.m4a') || name.endsWith('.wav')) {
    return FileType.AUDIO;
  }
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return FileType.PDF;
  }
  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    type === 'application/msword' ||
    name.endsWith('.docx') || 
    name.endsWith('.doc')
  ) {
    return FileType.DOCX;
  }
  if (type === 'text/plain' || name.endsWith('.txt') || name.endsWith('.md')) {
    return FileType.TEXT;
  }
  return FileType.UNKNOWN;
};

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data URI prefix (e.g., "data:audio/mp3;base64,")
      // Some browsers/files might have different headers, split by comma is safest
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

export const processUploadedFile = async (file: File): Promise<UploadedFile> => {
  const type = getFileType(file);
  let data = '';

  // Only read as text if it is explicitly a text file type. 
  // PDFs and DOCX should always be Base64 for Gemini.
  if (type === FileType.TEXT) {
    data = await readFileAsText(file);
  } else {
    data = await readFileAsBase64(file);
  }

  return {
    name: file.name,
    type,
    mimeType: file.type || 'application/octet-stream',
    data,
    size: file.size
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
