package restaurant.common.response;

import lombok.*;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Đối tượng đóng gói dữ liệu phân trang chuẩn hóa cho các API truy vấn danh sách lớn.
 * Kết nối với đối tượng {@code Page<T>} của Spring Data JPA tại tầng {@code Service} và được bọc
 * bên trong {@code ApiResponse<PageResponse<T>>} tại tầng {@code Controller} để cung cấp đầy đủ
 * siêu dữ liệu phân trang (số trang hiện tại, kích thước trang, tổng phần tử, tổng số trang) cho Client.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private int pageNo;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public static <T> PageResponse<T> fromPage(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .pageNo(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}