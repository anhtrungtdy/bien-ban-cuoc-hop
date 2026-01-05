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
  TEMPLATE = 1,
  PROCESSING = 2,
  RESULT = 3
}

export interface ProcessingStatus {
  isProcessing: boolean;
  message: string;
  progress: number; // 0 to 100
  error?: string;
}

export const DEFAULT_TEMPLATE = `
# BIÊN BẢN CUỘC HỌP (MEETING MINUTES)

**Chủ đề:** [Tự động trích xuất]
**Thời gian:** [Tự động trích xuất]
**Thành phần tham dự:** [Danh sách người tham gia]

---

## 1. Nội dung chính (Key Discussion Points)
- [Điểm chính 1]
- [Điểm chính 2]
- [Chi tiết thảo luận...]

## 2. Các quyết định đã được thông qua (Decisions Made)
- [Quyết định 1]
- [Quyết định 2]

## 3. Kế hoạch hành động (Action Items)
| Nhiệm vụ | Người phụ trách | Thời hạn |
| :--- | :--- | :--- |
| [Mô tả nhiệm vụ] | [Tên] | [Ngày/Tháng] |
| [Mô tả nhiệm vụ] | [Tên] | [Ngày/Tháng] |

---

**Ghi chú bổ sung:**
[Các thông tin khác nếu có]
`;
