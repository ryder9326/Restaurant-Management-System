package restaurant.modules.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import restaurant.modules.inventory.entity.CoSoVatChat;

import java.util.List;

/**
 * Giao diện truy xuất dữ liệu MySQL cho thực thể {@code CoSoVatChat} và bảng nhà cung cấp {@code cungcapcsvc}.
 * Kết nối với {@code InventoryServiceImpl} để lọc tài sản theo tình trạng sử dụng hoặc theo nhân viên phụ trách.
 */
@Repository
public interface CoSoVatChatRepository extends JpaRepository<CoSoVatChat, String> {

    List<CoSoVatChat> findByTinhTrang(String tinhTrang);

    List<CoSoVatChat> findByNhanVienQuanLy_MaNV(String maNV);
}