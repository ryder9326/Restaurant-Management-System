package restaurant.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Lớp thực thể cơ sở (MappedSuperclass) cung cấp các trường lưu vết thời gian và người thao tác dữ liệu.
 * Kết nối trực tiếp với {@code JpaAuditingConfig} và {@code AuditingEntityListener} của Spring Data JPA
 * để tự động ghi nhận {@code createdAt}, {@code updatedAt}, {@code createdBy}, {@code updatedBy}
 * cho các Entity kế thừa khi phát sinh thao tác thêm mới hoặc cập nhật bản ghi trong MySQL.
 */
@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseAuditEntity {

    @CreatedDate
    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "UpdatedAt")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "CreatedBy", length = 50, updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "UpdatedBy", length = 50)
    private String updatedBy;
}
