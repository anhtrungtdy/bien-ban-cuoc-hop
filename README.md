# MinuteMaster AI

Ứng dụng tạo biên bản cuộc họp tự động sử dụng Google Gemini AI, hỗ trợ MP3, PDF, DOCX.

## 🚀 Hướng Dẫn Cài Đặt Lên Hosting (Hỗ trợ Python)

Dự án này bao gồm Frontend (React/Vite) và một Backend Python (Flask) nhẹ để phục vụ file tĩnh.

### Cách 1: Hosting có hỗ trợ cả Node.js và Python (Ví dụ: Render, Railway, Heroku)

1.  Push code lên GitHub.
2.  Kết nối Repo với Hosting.
3.  Cấu hình **Build Command**: `npm install && npm run build` (để tạo thư mục `dist`).
4.  Cấu hình **Start Command**: `gunicorn main:app` (để chạy Python server).
5.  **Quan trọng:** Cài đặt Biến môi trường (Environment Variable) `API_KEY` trong phần cài đặt của Hosting với giá trị là key từ Google AI Studio.

### Cách 2: Hosting chỉ hỗ trợ Python (cPanel, PythonAnywhere, VPS thuần)

Vì hosting không có Node.js để build code React, bạn cần build thủ công trên máy tính cá nhân trước.

1.  **Trên máy tính của bạn:**
    *   Cài đặt Node.js.
    *   Chạy lệnh: `npm install`
    *   Chạy lệnh: `npm run build`
    *   Lệnh trên sẽ tạo ra thư mục `dist`.
2.  **Push lên GitHub:**
    *   Đảm bảo thư mục `dist` **được commit và push** lên GitHub (File `.gitignore` trong dự án này đã cho phép đẩy folder `dist`).
3.  **Trên Hosting:**
    *   Kết nối GitHub hoặc upload code.
    *   Cài đặt các gói Python từ `requirements.txt`.
    *   Cấu hình Entry point (file khởi động) là `main.py` (hoặc `main:app` nếu dùng Passenger/WSGI).
    *   Thiết lập biến môi trường `API_KEY`.

## 🛠 Cấu Trúc Dự Án

*   `src/`: Mã nguồn React (Frontend).
*   `dist/`: Mã nguồn đã được biên dịch (HTML/CSS/JS) để chạy trên Production.
*   `main.py`: Web Server Python (Flask) để phục vụ thư mục `dist`.
*   `requirements.txt`: Thư viện Python cần thiết.

## 🔑 Biến Môi Trường (Environment Variables)

Ứng dụng bắt buộc phải có biến môi trường sau để hoạt động:

*   `API_KEY`: API Key lấy từ [Google AI Studio](https://aistudio.google.com/).
