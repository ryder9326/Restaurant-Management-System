package restaurant.common.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import restaurant.common.security.CustomUserDetails;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Thành phần chịu trách nhiệm khởi tạo, giải mã và kiểm tra tính hợp lệ của chuỗi JWT (Access Token & Refresh Token).
 * Kết nối với các tham số {@code app.jwt.*} trong {@code application.properties}, tự động kiểm tra độ mạnh của khóa
 * bí mật khi khởi chạy và cung cấp dịch vụ xác thực cho {@code AuthServiceImpl} cùng {@code JwtAuthenticationFilter}.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private static final int MIN_SECRET_BYTE_LENGTH = 32;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    private SecretKey signingKey;

    @PostConstruct
    public void initAndValidateSecret() {
        if (!StringUtils.hasText(jwtSecret)) {
            throw new IllegalStateException(
                    "Thiếu cấu hình bảo mật bắt buộc: Biến môi trường JWT_SECRET chưa được thiết lập."
            );
        }
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("JWT_SECRET phải là chuỗi mã hóa Base64 hợp lệ.", ex);
        }
        if (keyBytes.length < MIN_SECRET_BYTE_LENGTH) {
            throw new IllegalStateException(
                    "JWT_SECRET không đủ độ mạnh bảo mật: Yêu cầu tối thiểu 256-bit (32 bytes sau khi giải mã Base64)."
            );
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return generateTokenFromUserDetails(userDetails);
    }

    public String generateTokenFromUserDetails(CustomUserDetails userDetails) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("maNV", userDetails.getMaNV())
                .claim("role", userDetails.getRole().name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey)
                .compact();
    }

    public String generateRefreshToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpirationMs);

        return Jwts.builder()
                .subject(username)
                .claim("type", "REFRESH")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("JWT validation failed: {}", ex.getMessage());
            return false;
        }
    }
}