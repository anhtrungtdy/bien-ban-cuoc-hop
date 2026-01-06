# MinuteMaster AI - Hướng dẫn Triển khai (Deployment)

Ứng dụng này được thiết kế để chạy trên môi trường Hybrid (Kết hợp):
- **Frontend**: ReactJS (được build bằng Node.js/Vite).
- **Backend**: Python Flask (để phục vụ file tĩnh và làm web server).

Dưới đây là hướng dẫn chi tiết để đưa ứng dụng lên các Hosting phổ biến (Render, Railway, Heroku) hoặc VPS.

---

## 1. Chuẩn bị trước khi Upload

Đảm bảo cấu trúc file của bạn có đầy đủ các file sau ở thư mục gốc:
- `main.py`: File khởi chạy server Python.
- `package.json`: Quản lý thư viện JS và lệnh build.
- `requirements.txt`: Quản lý thư viện Python.
- `vite.config.ts`: Cấu hình build frontend.

---

## 2. Triển khai lên Hosting (Khuyên dùng: Render.com)

Render là nền tảng miễn phí/giá rẻ hỗ trợ rất tốt cho dạng ứng dụng này.

### Bước 1: Đẩy code lên GitHub
Tạo một repository trên GitHub và push toàn bộ code của bạn lên đó.

### Bước 2: Tạo Web Service trên Render
1. Truy cập [dashboard.render.com](https://dashboard.render.com/).
2. Chọn **New +** -> **Web Service**.
3. Kết nối với repository GitHub của bạn.

### Bước 3: Cấu hình Build & Run
Điền các thông số sau (Rất quan trọng):

- **Name**: `minutemaster-ai` (hoặc tùy ý).
- **Environment**: `Python 3` (Chọn Python vì đây là môi trường chạy chính).
- **Build Command**: 
  ```bash
  npm install && npm run build && pip install -r requirements.txt
  ```
  *(Giải thích: Lệnh này sẽ cài Node modules -> Build React ra thư mục `dist` -> Cài thư viện Python)*.
  
- **Start Command**: 
  ```bash
  gunicorn main:app
  ```
  *(Giải thích: Dùng Gunicorn để chạy file `main.py` chuyên nghiệp hơn chạy trực tiếp python)*.

### Bước 4: Cấu hình API Key (Bảo mật)
1. Cuộn xuống phần **Environment Variables**.
2. Nhấn **Add Environment Variable**.
3. Key: `API_KEY`
4. Value: `Paste_Key_Cua_Ban_Vao_Day` (Nên dùng key riêng lấy từ [Google AI Studio](https://aistudio.google.com/)).
   *Nếu không điền, ứng dụng sẽ dùng danh sách key dùng chung mặc định (dễ bị hết quota).*

### Bước 5: Deploy
Nhấn **Create Web Service**. Chờ khoảng 3-5 phút để hệ thống build và start server.

---

## 3. Triển khai lên VPS (Ubuntu/CentOS)

Nếu bạn dùng VPS riêng, hãy làm theo các bước sau:

### Cài đặt môi trường
```bash
# Cài Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài Python và pip
sudo apt-get install python3 python3-pip python3-venv
```

### Build ứng dụng
```bash
# Clone code về
git clone <link-repo-cua-ban>
cd minutemaster-ai

# Build Frontend
npm install
npm run build

# Setup Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Chạy Server
```bash
# Chạy thử
export API_KEY="your_api_key_here"
gunicorn --bind 0.0.0.0:80 main:app
```
*(Để chạy lâu dài, hãy dùng Nginx và Supervisor/Systemd)*.

---

## 4. Troubleshooting (Sửa lỗi thường gặp)

**Lỗi: "Internal Server Error" hoặc App không hiện lên**
- Kiểm tra xem thư mục `dist` có được tạo ra không? (Xem log phần Build).
- Kiểm tra `Start Command` có đúng là `gunicorn main:app` không.

**Lỗi: AI không trả lời (Lỗi 500/400)**
- Kiểm tra `API_KEY` trong Environment Variables.
- Đảm bảo Google AI Studio Key của bạn còn hạn mức (Quota).

**Lỗi: Không tải được file mẫu**
- Đảm bảo server có quyền truy cập internet để tải file từ URL bên ngoài.

---

© 2024 MinuteMaster AI
