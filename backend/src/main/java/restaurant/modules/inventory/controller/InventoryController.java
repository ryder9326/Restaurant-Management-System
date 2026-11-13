package restaurant.modules.inventory.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import restaurant.common.response.ApiResponse;
import restaurant.common.response.PageResponse;
import restaurant.modules.inventory.dto.CoSoVatChatDTO;
import restaurant.modules.inventory.dto.NguyenLieuDTO;
import restaurant.modules.inventory.service.InventoryService;

import java.math.BigDecimal;
import java.util.List;

/**
 * Bộ điều khiển REST API cung cấp các endpoint quản lý cơ sở vật chất, kho nguyên liệu
 * và tra cứu thành phần nguyên liệu theo món ăn.
 * Kết nối trực tiếp với {@code InventoryService} để xử lý nghiệp vụ và tuân thủ luật phân quyền
 * {@code /inventory/**} trong {@code SecurityConfig}.
 */
@Validated
@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/facilities")
    public ResponseEntity<ApiResponse<CoSoVatChatDTO>> createFacility(
            @Valid @RequestBody CoSoVatChatDTO dto) {
        CoSoVatChatDTO created = inventoryService.createFacility(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Thêm mới cơ sở vật chất thành công"));
    }

    @PatchMapping("/facilities/{maTaiSan}/status")
    public ResponseEntity<ApiResponse<CoSoVatChatDTO>> updateFacilityStatus(
            @PathVariable String maTaiSan,
            @RequestParam @NotBlank(message = "Tình trạng không được để trống") String tinhTrang) {
        return ResponseEntity.ok(ApiResponse.success(
                inventoryService.updateFacilityStatus(maTaiSan, tinhTrang),
                "Cập nhật tình trạng tài sản thành công"));
    }

    @PostMapping("/facilities/{maTaiSan}/suppliers")
    public ResponseEntity<ApiResponse<CoSoVatChatDTO>> addFacilitySupplier(
            @PathVariable String maTaiSan,
            @RequestParam @NotBlank(message = "Tên nhà cung cấp không được để trống") String supplierName) {
        return ResponseEntity.ok(ApiResponse.success(
                inventoryService.addFacilitySupplier(maTaiSan, supplierName),
                "Bổ sung nhà cung cấp tài sản thành công"));
    }

    @GetMapping("/facilities")
    public ResponseEntity<ApiResponse<PageResponse<CoSoVatChatDTO>>> getAllFacilities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "maTaiSan") String sortBy) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllFacilities(pageable)));
    }

    @PostMapping("/ingredients")
    public ResponseEntity<ApiResponse<NguyenLieuDTO>> createIngredient(
            @Valid @RequestBody NguyenLieuDTO dto) {
        NguyenLieuDTO created = inventoryService.createIngredient(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Thêm mới nguyên liệu thành công"));
    }

    @PatchMapping("/ingredients/{maNguyenLieu}/import")
    public ResponseEntity<ApiResponse<NguyenLieuDTO>> importIngredientStock(
            @PathVariable String maNguyenLieu,
            @RequestParam BigDecimal quantity) {
        return ResponseEntity.ok(ApiResponse.success(
                inventoryService.importIngredientStock(maNguyenLieu, quantity),
                "Nhập kho nguyên liệu thành công"));
    }

    @PostMapping("/ingredients/{maNguyenLieu}/suppliers")
    public ResponseEntity<ApiResponse<NguyenLieuDTO>> addIngredientSupplier(
            @PathVariable String maNguyenLieu,
            @RequestParam @NotBlank(message = "Tên nhà cung cấp không được để trống") String supplierName) {
        return ResponseEntity.ok(ApiResponse.success(
                inventoryService.addIngredientSupplier(maNguyenLieu, supplierName),
                "Bổ sung nhà cung cấp nguyên liệu thành công"));
    }

    @GetMapping("/ingredients/by-dish")
    public ResponseEntity<ApiResponse<List<NguyenLieuDTO>>> getIngredientsByDishName(
            @RequestParam @NotBlank(message = "Tên món ăn không được để trống") String tenMon) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getIngredientsByDishName(tenMon)));
    }

    @GetMapping("/ingredients/expiring")
    public ResponseEntity<ApiResponse<List<NguyenLieuDTO>>> getExpiringIngredients(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getExpiringIngredients(days)));
    }

    @GetMapping("/ingredients/low-stock")
    public ResponseEntity<ApiResponse<List<NguyenLieuDTO>>> getLowStockIngredients(
            @RequestParam(defaultValue = "5.0") BigDecimal threshold) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStockIngredients(threshold)));
    }
}
