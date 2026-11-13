# Backend - Restaurant Management System

Ứng dụng REST API quản lý nghiệp vụ nhà hàng, viết bằng Java 21 và Spring Boot 3.5.7. Dữ liệu lưu trên MySQL; API được bảo vệ bằng Spring Security và JWT.

## Kiến trúc

Mã nguồn nằm trong `src/main/java/restaurant` và chia theo nghiệp vụ:

- `modules/auth`: đăng nhập, làm mới JWT và hồ sơ nhân viên.
- `modules/reservation`: khách hàng, bàn và đặt bàn.
- `modules/menuorder`: thực đơn và gọi món.
- `modules/billing`: hóa đơn, giảm giá, thanh toán và thống kê.
- `modules/hr`: nhân viên và ca làm việc.
- `modules/inventory`: nguyên liệu và cơ sở vật chất.
- `common`: cấu hình chung, bảo mật, phản hồi API và xử lý lỗi.

Trong mỗi phân hệ, luồng xử lý chính là:

`Controller → Service → Repository → Entity → MySQL`

`Controller` nhận/trả HTTP và DTO; `Service` xử lý nghiệp vụ và giao dịch; `Repository` truy cập dữ liệu; `Entity` ánh xạ bảng. Mapper chuyển đổi giữa Entity và DTO. Logic dùng chung đặt trong `common`, không nhân bản giữa các phân hệ.

## Chạy tại máy cá nhân

Yêu cầu: JDK 21, Maven và MySQL.

1. Tạo/cấu hình database MySQL. Khi bật Flyway, migration trong `src/main/resources/db/migration` tạo cấu trúc và dữ liệu mẫu.
2. Thiết lập `JWT_SECRET` là chuỗi Base64 có độ dài sau giải mã tối thiểu 32 byte. Cấu hình database trong `application-dev.properties` hoặc qua biến môi trường `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
3. Chạy từ thư mục `backend`:

   ```powershell
   mvn spring-boot:run "-Dspring-boot.run.profiles=dev"
   ```

   Hoặc build:

   ```powershell
   mvn clean package
   ```

Không đưa mật khẩu database hoặc JWT secret thật lên Git; file cấu hình `dev` chỉ dùng cho môi trường cá nhân.

## API

- Base URL mặc định: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/api/v1/swagger-ui.html`
- Các API nghiệp vụ yêu cầu JWT Bearer, trừ endpoint đăng nhập và làm mới token. Quyền truy cập được cấu hình trong `common/security/SecurityConfig.java`.
- Phản hồi thành công dùng `ApiResponse`; lỗi và lỗi validation được chuẩn hóa tại `common/exception/GlobalExceptionHandler.java`.

## Quy ước khi phát triển

- Thêm chức năng vào đúng phân hệ; giữ controller mỏng và xử lý nghiệp vụ trong service.
- Dùng DTO cho dữ liệu API, không trả Entity trực tiếp.
- Đánh dấu giao dịch ghi dữ liệu bằng `@Transactional`; thêm thay đổi schema bằng migration Flyway mới, không sửa migration đã chạy ở môi trường dùng chung.
- Bổ sung kiểm tra đầu vào, phân quyền và kiểm thử cho hành vi mới.
