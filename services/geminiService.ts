import { GoogleGenAI } from "@google/genai";
import { UploadedFile, FileType, GenerationResult, ProcessingMode, RawMeetingData } from "../types";

// 1. RAW EXTRACTION INSTRUCTION
// Updated to explicitly request Strings, not Arrays/Objects
const SYSTEM_INSTRUCTION_RAW = `Bạn là chuyên gia phân tích biên bản cuộc họp.
Nhiệm vụ: Đọc nội dung đầu vào (âm thanh transcript hoặc văn bản) và trích xuất thông tin CỐT LÕI vào định dạng JSON chuẩn.

Định dạng JSON trả về (BẮT BUỘC CÁC VALUE PHẢI LÀ STRING, KHÔNG DÙNG ARRAY HAY NESTED OBJECT):
{
  "title": "Chủ đề cuộc họp (String)",
  "dateTime": "Ngày giờ diễn ra, bao gồm giờ bắt đầu và giờ kết thúc (nếu có) (String)",
  "location": "Địa điểm/Online (String)",
  "attendees": "Danh sách người tham dự đầy đủ chức vụ (String). Ví dụ: 1. Ông A - GĐ; 2. Bà B - TP...",
  "summary": "Tóm tắt ngắn gọn mục đích cuộc họp (String)",
  "discussions": "Chi tiết các nội dung thảo luận và báo cáo (String). Sử dụng gạch đầu dòng (-) hoặc số thứ tự (1.) để phân tách các ý.",
  "decisions": "Các quyết định đã được chốt (String). Ví dụ: 1. Thống nhất A; 2. Phê duyệt B...",
  "actionItems": "Các việc cần làm (String). Ví dụ: 1. Ông A làm việc B (Hạn: 30/10)..."
}

Lưu ý quan trọng:
- Value của JSON phải là chuỗi ký tự (String).
- Nếu có danh sách, hãy dùng ký tự xuống dòng (\\n) và gạch đầu dòng (-) ngay trong chuỗi.
- KHÔNG trả về mảng JSON [ ... ] hay object lồng nhau { ... }.
- Nếu không tìm thấy thông tin, để chuỗi rỗng "".
`;

// 2. MAPPING TO TEMPLATE INSTRUCTION - UPDATED FOR SCIENTIFIC LAYOUT & COLOR STRUCTURE
const SYSTEM_INSTRUCTION_MAPPING = `Bạn là chuyên gia soạn thảo văn bản hành chính (Form Filler).
Nhiệm vụ: Lấy dữ liệu từ "Nội dung biên bản thô" để điền vào các "Template Keys".

QUY TẮC XỬ LÝ ĐẶC BIỆT CHO KEY: "noi_dung_cuoc_hop":
Bạn phải soạn thảo một BIÊN BẢN CUỘC HỌP CHUYÊN NGHIỆP, TRÌNH BÀY KHOA HỌC (SCIENTIFIC LAYOUT).

YÊU CẦU VỀ ĐỊNH DẠNG CHI TIẾT:

1. CÁC PHẦN LỚN (I., II., III., IV.):
   - BẮT BUỘC viết số La Mã kèm tên phần.
   - BẮT BUỘC VIẾT HOA TOÀN BỘ (UPPERCASE).
   - Ví dụ: "I. THÔNG TIN CHUNG", "II. NỘI DUNG CUỘC HỌP".

2. CÁC MỤC NHỎ (1., 2., 3.):
   - Viết Hoa Chữ Cái Đầu.
   - Nội dung gãy gọn, rõ ràng.

3. PHẦN "THÀNH PHẦN THAM DỰ" (Rất quan trọng):
   - Trình bày dạng danh sách liệt kê từng dòng.
   - Định dạng chuẩn: "• [Ông/Bà] [Họ tên] ([Chức vụ])".
   - Ví dụ:
     • Ông Nguyễn Văn A (Giám đốc)
     • Bà Lê Thị B (Trưởng phòng HCNS)
   - Nếu có "Vắng mặt", ghi rõ lý do trong ngoặc đơn.

4. KHOẢNG CÁCH DÒNG (SPACING):
   - Giữa các Phần Lớn (I và II) phải cách nhau 1 dòng trống.
   - Giữa tiêu đề mục nhỏ và nội dung không cần dòng trống, nhưng giữa các ý lớn nên xuống dòng.

CẤU TRÚC MẪU MONG MUỐN (Output String):

I. THÔNG TIN CHUNG
• Thời gian: ...
• Địa điểm: ...
• Chủ trì: ...
• Thành phần tham dự:
• Ông [Tên] ([Chức vụ])
• Bà [Tên] ([Chức vụ])
• Thư ký: ...

II. NỘI DUNG CUỘC HỌP
1. [Tiêu đề mục 1]
- Nội dung chi tiết thảo luận...
- Ý kiến đóng góp...

2. [Tiêu đề mục 2]
- Nội dung báo cáo...

III. QUYẾT NGHỊ CỦA CUỘC HỌP
Sau khi thảo luận, cuộc họp thống nhất:
1. Nội dung quyết nghị 1...
2. Nội dung quyết nghị 2...

IV. DANH SÁCH CÔNG VIỆC (ACTION ITEMS)
STT  Nội dung công việc    Người thực hiện    Thời hạn
1    [Công việc A]        [Tên]              [Ngày]
2    [Công việc B]        [Tên]              [Ngày]

QUY TẮC CHUNG CHO CÁC KEY KHÁC:
- Ánh xạ thông tin tương ứng từ dữ liệu thô.
- Tuyệt đối KHÔNG dùng Markdown (**, ##) trong giá trị trả về vì đây là file Word.
- Trả về JSON phẳng: { "key": "value" }.
`;

// 3. SMART MERGE INSTRUCTION (Fallback when no keys found)
const SYSTEM_INSTRUCTION_MERGE = `Bạn là Thư Ký AI chuyên nghiệp.
Nhiệm vụ: Viết một biên bản cuộc họp hoàn chỉnh (Full Meeting Minutes) dưới dạng Markdown.

Đầu vào:
1. Dữ liệu chi tiết cuộc họp (JSON).
2. Cấu trúc/Văn phong mẫu (Template Text).

Yêu cầu xử lý:
1. **Phân tích Mẫu:** Hiểu cấu trúc, thứ tự các mục, và giọng văn của văn bản mẫu.
2. **Hợp nhất:** Sử dụng thông tin từ "Dữ liệu chi tiết" để viết lại biên bản sao cho CẤU TRÚC giống hệt Mẫu.
3. **Thông minh:** Tự động nhận diện phần "Nội dung chính" trong mẫu để thay thế bằng dữ liệu thảo luận thực tế. Giữ nguyên các phần Tiêu đề, Lời mở đầu, Kết thúc của mẫu nếu chúng mang tính thủ tục.
4. **Định dạng:** Trình bày đẹp, sử dụng Markdown (Bold **, List -, Table).
`;

// Helper to prevent [object Object] by flattening arrays/objects to strings
const sanitizeRawData = (data: any): RawMeetingData => {
  const cleanString = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === 'string') return val;
    
    // If it's an array
    if (Array.isArray(val)) {
      return val.map(item => {
        if (typeof item === 'object' && item !== null) {
          return `- ${Object.values(item).filter(v => v !== null && v !== undefined && String(v).trim() !== '').join(' - ')}`;
        }
        return `- ${String(item)}`;
      }).join('\n');
    }
    
    // If it's a single object
    if (typeof val === 'object') {
       return Object.values(val).filter(v => v !== null && v !== undefined && String(v).trim() !== '').join('\n');
    }
    
    return String(val);
  };

  return {
    title: cleanString(data.title),
    dateTime: cleanString(data.dateTime),
    location: cleanString(data.location),
    attendees: cleanString(data.attendees),
    summary: cleanString(data.summary),
    discussions: cleanString(data.discussions),
    decisions: cleanString(data.decisions),
    actionItems: cleanString(data.actionItems),
  };
};

export const extractRawMeetingData = async (
  sourceFile: UploadedFile,
  apiKey: string
): Promise<RawMeetingData> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview'; 

  const parts: any[] = [];
  if (sourceFile.type === FileType.TEXT || sourceFile.type === FileType.DOCX) {
    parts.push({ text: `--- NỘI DUNG CUỘC HỌP ---\n${sourceFile.data}\n--- HẾT ---` });
  } else {
    parts.push({ inlineData: { mimeType: sourceFile.mimeType, data: sourceFile.data } });
  }
  parts.push({ text: "Hãy trích xuất thông tin biên bản thô." });

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_RAW,
      responseMimeType: "application/json",
      temperature: 0.2,
    }
  });

  try {
    const jsonText = response.text || "{}";
    const parsedData = JSON.parse(jsonText);
    return sanitizeRawData(parsedData);
  } catch (e) {
    console.error("Error parsing raw data JSON", e);
    return {
      title: "Lỗi trích xuất hoặc không tìm thấy tiêu đề",
      dateTime: "",
      location: "",
      attendees: "",
      summary: "",
      discussions: response.text || "",
      decisions: "",
      actionItems: ""
    };
  }
};

export const mapContentToTemplate = async (
  rawData: RawMeetingData,
  templateKeys: string[],
  apiKey: string
): Promise<GenerationResult> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview'; 

  const contextString = `
  --- DỮ LIỆU BIÊN BẢN THÔ ---
  CHỦ ĐỀ: ${rawData.title}
  THỜI GIAN: ${rawData.dateTime}
  ĐỊA ĐIỂM: ${rawData.location}
  THÀNH PHẦN: ${rawData.attendees}
  TÓM TẮT: ${rawData.summary}
  NỘI DUNG THẢO LUẬN: ${rawData.discussions}
  QUYẾT ĐỊNH: ${rawData.decisions}
  HÀNH ĐỘNG TIẾP THEO: ${rawData.actionItems}
  -----------------------------
  `;

  const keysList = templateKeys.map(k => `"${k}"`).join(", ");
  const prompt = `
  Danh sách các KEYS trong File Word (Placeholders):
  [${keysList}]
  
  Yêu cầu:
  1. Nếu danh sách keys có "noi_dung_cuoc_hop", hãy thực hiện "QUY TẮC XỬ LÝ ĐẶC BIỆT" để tạo ra biên bản hoàn chỉnh. 
     Chú ý: Định dạng Thành phần tham dự phải là "• Tên (Chức vụ)".
  2. Với các key khác (nếu có), hãy điền thông tin tương ứng.
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts: [{ text: contextString }, { text: prompt }] },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_MAPPING,
      responseMimeType: "application/json",
      temperature: 0.1,
    }
  });

  const jsonText = response.text || "{}";
  const jsonData = JSON.parse(jsonText);

  const safeJsonData: Record<string, string> = {};
  Object.keys(jsonData).forEach(key => {
      const val = jsonData[key];
      if (typeof val === 'object' || Array.isArray(val)) {
           if (Array.isArray(val)) {
               safeJsonData[key] = val.map(v => {
                   if (typeof v === 'object' && v !== null) {
                       return Object.values(v).filter(subV => subV).join(' - ');
                   }
                   return String(v);
               }).join('\n- ');
           } else if (val !== null) {
               safeJsonData[key] = Object.values(val).filter(subV => subV).join(', ');
           } else {
               safeJsonData[key] = "";
           }
      } else {
          safeJsonData[key] = val === null || val === undefined ? "" : String(val);
      }
  });

  return {
    mode: ProcessingMode.FILL_TEMPLATE,
    jsonData: safeJsonData,
    templateKeys: templateKeys
  };
};

export const generateFinalMinutes = async (
    rawData: RawMeetingData,
    templateText: string,
    apiKey: string
): Promise<GenerationResult> => {
    if (!apiKey) throw new Error("API Key is missing");
    const ai = new GoogleGenAI({ apiKey });
    const modelName = 'gemini-3-flash-preview';
  
    const contextString = `
    --- DỮ LIỆU CHI TIẾT CUỘC HỌP ---
    Title: ${rawData.title}
    Time: ${rawData.dateTime}
    Location: ${rawData.location}
    Attendees: ${rawData.attendees}
    Discussions: ${rawData.discussions}
    Decisions: ${rawData.decisions}
    Action Items: ${rawData.actionItems}
    -----------------------------------
    `;
  
    const prompt = `
    Dưới đây là nội dung văn bản của File Mẫu (Template):
    """
    ${templateText.substring(0, 10000)} ... (cắt ngắn nếu quá dài)
    """
    
    Hãy viết biên bản hoàn chỉnh dựa trên Dữ liệu chi tiết, nhưng tuân thủ cấu trúc và cách dùng từ của File Mẫu trên.
    `;
  
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: contextString }, { text: prompt }] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_MERGE,
        temperature: 0.4,
      }
    });
  
    return {
      mode: ProcessingMode.GENERATE_MARKDOWN,
      markdown: response.text || "Không thể tạo nội dung."
    };
};

export const generateMinutes = async (
    sourceFile: UploadedFile,
    textTemplate: string,
    templateFile: UploadedFile | null,
    templateKeys: string[],
    apiKey: string
  ): Promise<GenerationResult> => {
     return { mode: ProcessingMode.GENERATE_MARKDOWN, markdown: "Legacy Mode" };
  }