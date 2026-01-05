import { GoogleGenAI } from "@google/genai";
import { UploadedFile, FileType } from "../types";

const SYSTEM_INSTRUCTION = `Bạn là một thư ký chuyên nghiệp, xuất sắc trong việc tổng hợp nội dung cuộc họp từ các tài liệu lớn.

Nhiệm vụ cốt lõi:
1.  **Phân tích toàn diện:** Đọc/Nghe toàn bộ nội dung đầu vào (dù là file ghi âm dài hàng giờ hay tài liệu dày). Không bỏ sót các chi tiết ở phần cuối.
2.  **Trích xuất thông tin:** Xác định Chủ đề, Thời gian, Thành phần tham dự, Nội dung thảo luận chính, Các tranh luận (nếu có), Kết luận cuối cùng, và Action Items (Ai làm gì, bao giờ xong).
3.  **Tuân thủ Template:** Trình bày kết quả CHÍNH XÁC theo cấu trúc Markdown mà người dùng cung cấp.
4.  **Xử lý ngôn ngữ:** Nếu file nguồn là tiếng nước ngoài, hãy dịch sang Tiếng Việt (trừ khi template yêu cầu khác).
5.  **Chất lượng:** Văn phong trang trọng, khách quan, rõ ràng.

Quy tắc xử lý file lớn:
- Với file ghi âm dài, hãy chú ý đến sự thay đổi người nói và các chuyển đoạn chủ đề.
- Nếu thông tin bị thiếu trong file nguồn, hãy ghi chú rõ ràng là "[Không có trong tài liệu]", tuyệt đối không bịa đặt.
`;

export const generateMinutes = async (
  file: UploadedFile,
  template: string,
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });

  // Gemini 2.5 Flash has a large context window (1M tokens), perfect for long audio/docs.
  const modelName = 'gemini-2.5-flash-latest';

  try {
    const parts: any[] = [];

    // Add the source material
    if (file.type === FileType.TEXT) {
      parts.push({
        text: `--- NỘI DUNG TÀI LIỆU NGUỒN ---\n\n${file.data}\n\n--- HẾT NỘI DUNG ---`
      });
    } else {
      // Audio, PDF, DOCX
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    }

    // Add the template requirement
    parts.push({
      text: `\n\nNHIỆM VỤ: Hãy đóng vai trò thư ký, phân tích toàn bộ dữ liệu ở trên và viết biên bản cuộc họp chi tiết.
      
      YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG (TEMPLATE):
      ${template}
      
      Hãy bắt đầu viết biên bản ngay bây giờ:`
    });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Low temperature for accuracy
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
