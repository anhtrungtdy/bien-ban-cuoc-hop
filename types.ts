export enum FileType {
  AUDIO = 'AUDIO',
  PDF = 'PDF',
  DOCX = 'DOCX',
  TEXT = 'TEXT',
  UNKNOWN = 'UNKNOWN'
}

export interface UploadedFile {
  name: string;
  type: FileType;
  mimeType: string;
  data: string; // Base64 or raw text
  size: number;
}

export enum AppStep {
  UPLOAD = 0,
  RAW_PREVIEW = 1, // New Step: Review raw extracted data
  TEMPLATE = 2,
  PROCESSING = 3,
  RESULT = 4
}

export interface ProcessingStatus {
  isProcessing: boolean;
  message: string;
  progress: number; // 0 to 100
  error?: string;
}

export enum ProcessingMode {
  GENERATE_MARKDOWN = 'GENERATE_MARKDOWN', 
  FILL_TEMPLATE = 'FILL_TEMPLATE'          
}

// Structure for the Raw Extracted Data (Step 1 output)
export interface RawMeetingData {
  title: string;
  dateTime: string;
  location: string;
  attendees: string; // List of names
  summary: string; // Executive summary
  discussions: string; // Detailed points
  decisions: string; // Key decisions made
  actionItems: string; // To-do list
}

export interface GenerationResult {
  mode: ProcessingMode;
  markdown?: string;       
  jsonData?: Record<string, any>; 
  templateKeys?: string[]; 
}

export const DEFAULT_TEMPLATE = `... (No changes needed here for logic) ...`;