package restaurant.modules.auth.enums;

/**
 * Định nghĩa tập hợp các vai trò phân quyền (Authorities) trong hệ thống.
 * Kết nối trực tiếp với {@code CustomUserDetails} (ánh xạ từ thuộc tính {@code chucVu} của {@code NhanVien})
 * và {@code SecurityConfig} để kiểm soát quyền truy cập tới từng nhóm API của các phân hệ nghiệp vụ.
 */
public enum Role {
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_RECEPTIONIST,
    ROLE_WAITER,
    ROLE_CASHIER,
    ROLE_INVENTORY_STAFF
}
