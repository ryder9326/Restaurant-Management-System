package restaurant.modules.inventory.service;

import org.springframework.data.domain.Pageable;
import restaurant.common.response.PageResponse;
import restaurant.modules.inventory.dto.CoSoVatChatDTO;
import restaurant.modules.inventory.dto.NguyenLieuDTO;

import java.math.BigDecimal;
import java.util.List;

/**
 * Giao diện định nghĩa các nghiệp vụ quản lý cơ sở vật chất, kho nguyên liệu, nhà cung cấp
 * và truy vấn thành phần nguyên liệu của món ăn.
 * Kết nối {@code InventoryController} với lớp triển khai {@code InventoryServiceImpl}.
 */
public interface InventoryService {

    CoSoVatChatDTO createFacility(CoSoVatChatDTO dto);

    CoSoVatChatDTO updateFacilityStatus(String maTaiSan, String tinhTrang);

    CoSoVatChatDTO addFacilitySupplier(String maTaiSan, String tenNhaCungCap);

    PageResponse<CoSoVatChatDTO> getAllFacilities(Pageable pageable);

    NguyenLieuDTO createIngredient(NguyenLieuDTO dto);

    NguyenLieuDTO importIngredientStock(String maNguyenLieu, BigDecimal additionalQuantity);

    NguyenLieuDTO addIngredientSupplier(String maNguyenLieu, String tenNhaCungCap);

    List<NguyenLieuDTO> getIngredientsByDishName(String tenMon);

    List<NguyenLieuDTO> getExpiringIngredients(int daysAhead);

    List<NguyenLieuDTO> getLowStockIngredients(BigDecimal threshold);
}
