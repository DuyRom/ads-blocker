FROM mitmproxy/mitmproxy:latest

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép entrypoint.sh và modify_response.py vào /app
COPY entrypoint.sh .
COPY modify_response.py .

# Cấp quyền thực thi cho entrypoint.sh
RUN chmod +x entrypoint.sh

# Chạy mitmproxy với transparent mode
ENTRYPOINT ["/app/entrypoint.sh"]