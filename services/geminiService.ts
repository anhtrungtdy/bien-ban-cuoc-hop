import { GoogleGenAI } from "@google/genai";
import { UploadedFile, FileType, GenerationResult, ProcessingMode, RawMeetingData, Participant } from "../types";

export const getSystemApiKey = (): string | null => {
  const envKey = process.env.API_KEY;
  if (!envKey) return null;
  const keys = envKey.split(',').map(k => k.trim()).filter(k => k);
  return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : null;
};

// 0. IDENTIFY PARTICIPANTS INSTRUCTION
const SYSTEM_INSTRUCTION_IDENTIFY = `Bạn là trợ lý phân tích cuộc họp. 
Nhiệm vụ: Quét nhanh nội dung và liệt kê danh sách những người tham gia/phát biểu.
Mục tiêu: Giúp người dùng xác định Giới tính (Ông/Bà) và Chức vụ nếu thiếu.

Trả về JSON mảng đối tượng:
[
  {
    "name": "Tên người tham gia",
    "gender": "Ông" hoặc "Bà" (Nếu không chắc chắn hoặc tên trung tính như 'Thịnh', 'Hòa', 'Tú', hãy để ""),
    "role": "Chức vụ" (Nếu không có, để ""),
    "isAmbiguous": true/false (True nếu thiếu chức vụ hoặc không rõ giới tính)
  }
]
Chỉ trả về JSON, không thêm text.
`;

export const identifyParticipants = async (
  sourceFile: UploadedFile,
  apiKey: string
): Promise<Participant[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview'; 

  const parts: any[] = [];
  if (sourceFile.type === FileType.TEXT || sourceFile.type === FileType.DOCX) {
    parts.push({ text: `--- SOURCE CONTENT ---\n${sourceFile.data}\n--- END ---` });
  } else {
    parts.push({ inlineData: { mimeType: sourceFile.mimeType, data: sourceFile.data } });
  }
  parts.push({ text: "Liệt kê danh sách người tham gia dưới dạng JSON." });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_IDENTIFY,
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    const jsonText = response.text || "[]";
    const rawList = JSON.parse(jsonText);
    
    return rawList.map((p: any, index: number) => ({
      id: `p-${index}`,
      name: p.name || "Người tham gia",
      gender: p.gender === 'Ông' || p.gender === 'Bà' ? p.gender : '',
      role: p.role || '',
      isAmbiguous: p.isAmbiguous || (!p.role || !p.gender)
    }));

  } catch (e) {
    console.error("Error identifying participants", e);
    return []; // Return empty if failed, user can add manually
  }
};

// 1. RAW EXTRACTION INSTRUCTION
const SYSTEM_INSTRUCTION_RAW = `Bạn là chuyên gia ghi chép biên bản cuộc họp (Stenographer/Analyst).
Nhiệm vụ: Đọc nội dung đầu vào (âm thanh transcript hoặc văn bản) và trích xuất TOÀN BỘ thông tin quan trọng vào định dạng JSON.

MỤC TIÊU: 
1. KHÔNG BỎ SÓT CHI TIẾT (số liệu, ngày tháng, quyết định).
2. XÁC ĐỊNH ĐÚNG DANH TÍNH NGƯỜI NÓI dựa trên "Context người dùng cung cấp".

Định dạng JSON trả về (BẮT BUỘC VALUE LÀ STRING):
{
  "title": "Chủ đề chính xác của cuộc họp (String)",
  "dateTime": "Ngày giờ diễn ra chi tiết (String)",
  "location": "Địa điểm cụ thể (String)",
  "attendees": "Danh sách chi tiết: • [Ông/Bà] [Tên] ([Chức vụ]). (String)",
  "summary": "Mục đích và bối cảnh chung của cuộc họp (String)",
  "discussions": "CHI TIẾT DIỄN BIẾN: Trình bày theo dòng thời gian hoặc theo vấn đề. Ghi rõ: Ai phát biểu? Nội dung là gì? Tranh luận ra sao? (String). Dùng gạch đầu dòng (-) để phân tách.",
  "decisions": "TẤT CẢ các kết luận, phê duyệt, hoặc sự đồng thuận cuối cùng của chủ tọa/lãnh đạo (String).",
  "actionItems": "Việc cần làm: Ai làm? Làm gì? Hạn chót? (String)"
}

Lưu ý:
- Value của JSON phải là chuỗi ký tự (String).
- Dùng \\n để xuống dòng trong chuỗi.
- BẮT BUỘC TUÂN THỦ Giới tính/Chức vụ trong phần USER CONTEXT.
`;

export const extractRawMeetingData = async (
  sourceFile: UploadedFile,
  userContext: string,
  apiKey: string
): Promise<RawMeetingData> => {
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview'; 

  const parts: any[] = [];
  
  // Add User Context prominently
  if (userContext && userContext.trim() !== "") {
    parts.push({ text: `=== DANH SÁCH THÀNH PHẦN THAM DỰ CHÍNH XÁC (USER VERIFIED) ===\n${userContext}\n(Hãy dùng thông tin trên để xác định đúng tên, giới tính và chức vụ người tham gia)\n================================================` });
  }

  if (sourceFile.type === FileType.TEXT || sourceFile.type === FileType.DOCX) {
    parts.push({ text: `--- NỘI DUNG CUỘC HỌP (SOURCE CONTENT) ---\n${sourceFile.data}\n--- HẾT NỘI DUNG ---` });
  } else {
    parts.push({ inlineData: { mimeType: sourceFile.mimeType, data: sourceFile.data } });
  }
  parts.push({ text: "Hãy trích xuất thông tin biên bản thô một cách chi tiết nhất dựa trên nội dung và danh sách thành phần đã xác thực." });

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_RAW,
      responseMimeType: "application/json",
      temperature: 0.2, // Low temperature for factual extraction
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

// 2. MAPPING TO TEMPLATE INSTRUCTION
const SYSTEM_INSTRUCTION_MAPPING = `Bạn là "AI Thư Ký Tổng Hợp Cao Cấp".
Nhiệm vụ của bạn là điền thông tin vào File Word mẫu dựa trên Dữ liệu thô.

QUY TRÌNH TƯ DUY (Thinking Process):
1. **Đọc Key trong Template**: Hiểu ý nghĩa ngữ nghĩa của key đó (Ví dụ: "{y_kien_chi_dao}" nghĩa là cần tìm lời nói của người lãnh đạo cao nhất trong phần thảo luận hoặc kết luận).
2. **Quét Toàn Bộ Dữ Liệu**: KHÔNG chỉ nhìn vào một trường tương ứng. Hãy tìm thông tin từ "discussions", "decisions", "summary", và "actionItems" để tổng hợp câu trả lời tốt nhất cho Key đó.
3. **Tối ưu hóa văn phong**: Viết lại nội dung cho trôi chảy, chuyên nghiệp, văn phong hành chính nghiêm túc.

QUY TẮC XỬ LÝ ĐẶC BIỆT CHO KEY: "noi_dung_cuoc_hop":
Đây là phần cốt lõi. Bạn phải TỔNG HỢP lại toàn bộ diễn biến cuộc họp thành một báo cáo khoa học.

YÊU CẦU ĐỊNH DẠNG "SCIENTIFIC LAYOUT" (BẮT BUỘC):
1. Chia các phần lớn bằng số La Mã (I., II., III.) và VIẾT HOA TOÀN BỘ TIÊU ĐỀ (UPPERCASE).
   - Ví dụ: "I. THÔNG TIN CHUNG", "II. DIỄN BIẾN CUỘC HỌP", "III. KẾT LUẬN".
2. Các mục nhỏ dùng số (1., 2.) in đậm tiêu đề.
3. Giữa các phần lớn (I, II) phải có 1 dòng trống (\n\n) để tạo độ thoáng.
4. Phần "Thành phần tham dự": Trình bày dạng danh sách dọc: "• Tên (Chức vụ)".

CẤU TRÚC MẪU CHO "noi_dung_cuoc_hop":
I. THÔNG TIN CHUNG
• Thời gian: ...
• Địa điểm: ...
• Thành phần:
• Ông A (Giám đốc)
• Bà B (Nhân viên)

II. NỘI DUNG LÀM VIỆC
1. Báo cáo của bộ phận chuyên môn
- Nội dung chi tiết...

2. Thảo luận và đóng góp ý kiến
- Ông X có ý kiến: ...
- Bà Y bổ sung: ...

III. KẾT LUẬN VÀ CHỈ ĐẠO
Cuộc họp thống nhất các nội dung sau:
1. Thống nhất phương án...
2. Giao nhiệm vụ...

IV. PHÂN CÔNG THỰC HIỆN
(Liệt kê các đầu việc, người phụ trách và hạn chót dưới dạng danh sách rõ ràng)

Lưu ý cuối cùng:
- Trả về JSON phẳng: { "key": "value" }.
- Value là chuỗi text đã được định dạng (có xuống dòng \\n).
`;

export const mapContentToTemplate = async (
  rawData: RawMeetingData,
  templateKeys: string[],
  apiKey: string
): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview'; 

  const contextString = `
  --- DỮ LIỆU BIÊN BẢN THÔ (NGUỒN) ---
  CHỦ ĐỀ: ${rawData.title}
  THỜI GIAN: ${rawData.dateTime}
  ĐỊA ĐIỂM: ${rawData.location}
  THÀNH PHẦN: ${rawData.attendees}
  TÓM TẮT: ${rawData.summary}
  NỘI DUNG THẢO LUẬN CHI TIẾT: ${rawData.discussions}
  QUYẾT ĐỊNH & KẾT LUẬN: ${rawData.decisions}
  HÀNH ĐỘNG TIẾP THEO: ${rawData.actionItems}
  -----------------------------
  `;

  const keysList = templateKeys.map(k => `"${k}"`).join(", ");
  const prompt = `
  Danh sách các KEYS (Placeholders) cần điền vào File Word:
  [${keysList}]
  
  Yêu cầu:
  1. Với mỗi Key, hãy tìm thông tin phù hợp nhất từ "DỮ LIỆU BIÊN BẢN THÔ".
  2. Nếu key là "noi_dung_cuoc_hop", hãy thực hiện quy tắc "SCIENTIFIC LAYOUT" đã hướng dẫn.
  3. Nếu key yêu cầu thông tin cụ thể (ví dụ: "chu_to_a_ket_luan"), hãy tìm trong phần Decisions hoặc Discussions xem chủ tọa nói gì.
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts: [{ text: contextString }, { text: prompt }] },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_MAPPING,
      responseMimeType: "application/json",
      temperature: 0.3,
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

// 3. SMART MERGE INSTRUCTION (Fallback)
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

export const generateFinalMinutes = async (
    rawData: RawMeetingData,
    templateText: string,
    apiKey: string
): Promise<GenerationResult> => {
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

export const generateMinutes = async (
    sourceFile: UploadedFile,
    textTemplate: string,
    templateFile: UploadedFile | null,
    templateKeys: string[],
    apiKey: string
  ): Promise<GenerationResult> => {
     return { mode: ProcessingMode.GENERATE_MARKDOWN, markdown: "Legacy Mode" };
  }