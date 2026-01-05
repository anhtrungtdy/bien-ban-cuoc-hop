import { FileType, UploadedFile } from '../types';

export const getFileType = (file: File): FileType => {
  if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.m4a') || file.name.endsWith('.wav')) {
    return FileType.AUDIO;
  }
  if (file.type === 'application/pdf') {
    return FileType.PDF;
  }
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
    return FileType.DOCX;
  }
  if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
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
