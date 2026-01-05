import { GoogleGenAI } from "@google/genai";
import { UploadedFile, FileType } from "../types";

const SYSTEM_INSTRUCTION = `Bạn là một thư ký chuyên nghiệp. Nhiệm vụ của bạn là tạo biên bản cuộc họp dựa trên dữ liệu đầu vào.

QUAN TRỌNG NHẤT VỀ ĐỊNH DẠNG:
1.  Nếu người dùng cung cấp một FILE MẪU (Template File), bạn phải **nhìn vào cấu trúc hình ảnh/văn bản** của file đó và tạo ra kết quả có bố cục (layout) tương tự nhất có thể bằng Markdown.
2.  Hãy chú ý đến các tiêu đề, các bảng biểu (số cột, tên cột), các gạch đầu dòng và cách trình bày của file mẫu.
3.  Kết quả trả về phải là định dạng Markdown.

QUY TRÌNH XỬ LÝ:
1.  Đọc/Nghe nội dung từ FILE NGUỒN (Source) để lấy thông tin.
2.  Nhìn vào FILE MẪU (Template) để lấy cấu trúc.
3.  Điền thông tin từ (1) vào cấu trúc của (2).
4.  Nếu file nguồn thiếu thông tin cho một mục nào đó trong mẫu, hãy để trống hoặc ghi "N/A", không được tự bịa ra thông tin.
5.  Sử dụng ngôn ngữ Tiếng Việt (trừ khi file mẫu yêu cầu tiếng Anh).
`;

export const generateMinutes = async (
  sourceFile: UploadedFile,
  textTemplate: string,
  templateFile: UploadedFile | null,
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash-latest';

  try {
    const parts: any[] = [];

    // --- PART 1: SOURCE CONTENT ---
    if (sourceFile.type === FileType.TEXT) {
      parts.push({
        text: `--- DỮ LIỆU NGUỒN CẦN XỬ LÝ (Source Content) ---\n\n${sourceFile.data}\n\n--- HẾT DỮ LIỆU NGUỒN ---`
      });
    } else {
      parts.push({
        inlineData: {
          mimeType: sourceFile.mimeType,
          data: sourceFile.data
        }
      });
      parts.push({ text: "Đây là dữ liệu nội dung cuộc họp (file ghi âm hoặc tài liệu gốc)." });
    }

    // --- PART 2: TEMPLATE ---
    if (templateFile) {
      // If user uploaded a binary template (PDF/DOCX)
      parts.push({
        inlineData: {
          mimeType: templateFile.mimeType,
          data: templateFile.data
        }
      });
      parts.push({ 
        text: "Đây là FILE MẪU (Template). Hãy phân tích cấu trúc, bảng biểu và cách trình bày của file này. Tạo ra biên bản cuộc họp có nội dung lấy từ dữ liệu nguồn, nhưng hình thức trình bày (Markdown) phải KHỚP với file mẫu này." 
      });
    } else {
      // Use text template
      parts.push({
        text: `\n\nYÊU CẦU VỀ ĐỊNH DẠNG (Text Template):\n${textTemplate}\n\nHãy điền thông tin vào mẫu trên.`
      });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
      }
    });

    return response.text || "Không thể tạo nội dung. Vui lòng thử lại.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMessage = "Đã xảy ra lỗi khi gọi Gemini API.";
    
    if (error.message?.includes('413')) {
      errorMessage = "File quá lớn so với giới hạn của API hiện tại. Vui lòng thử file nhỏ hơn hoặc cắt ngắn bớt.";
    } else if (error.message?.includes('400')) {
      errorMessage = "Dữ liệu đầu vào không hợp lệ hoặc định dạng file bị lỗi.";
    }

    throw new Error(errorMessage);
  }
};
