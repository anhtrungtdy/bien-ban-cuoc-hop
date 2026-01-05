import { FileType, UploadedFile } from '../types';
import mammoth from 'mammoth';

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

export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const processUploadedFile = async (file: File): Promise<UploadedFile> => {
  const type = getFileType(file);
  let data = '';
  let finalType = type;
  let mimeType = file.type || 'application/octet-stream';

  if (type === FileType.TEXT) {
    data = await readFileAsText(file);
  } else if (type === FileType.DOCX) {
    // Convert DOCX to Raw Text because Gemini API doesn't support DOCX inlineData directly
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const result = await mammoth.extractRawText({ arrayBuffer });
      data = result.value;
      // We treat the processed DOCX as TEXT for the AI
      finalType = FileType.TEXT; 
      mimeType = 'text/plain';
    } catch (error) {
      console.error("Error parsing DOCX:", error);
      throw new Error("Không thể đọc file DOCX. Vui lòng thử lại hoặc chuyển sang PDF.");
    }
  } else {
    // Audio, PDF
    data = await readFileAsBase64(file);
  }

  return {
    name: file.name,
    type: finalType,
    mimeType: mimeType,
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