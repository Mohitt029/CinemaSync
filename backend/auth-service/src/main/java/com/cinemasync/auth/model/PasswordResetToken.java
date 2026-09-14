// backend/auth-service/src/main/java/com/cinemasync/auth/model/PasswordResetToken.java
package com.cinemasync.auth.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    private String id;

    /** SHA-256 hash of the raw token (raw token is only in the email link) */
    @Indexed(unique = true)
    private String tokenHash;

    @Indexed
    private String userId;

    @Indexed
    private String email;

    private LocalDateTime expiresAt;

    @Builder.Default
    private boolean used = false;

    private LocalDateTime usedAt;

    private LocalDateTime createdAt;

    private String requestedIp;

    /** Auto-delete by Mongo TTL after 24h past expiry (belt-and-braces) */
    @Indexed(expireAfterSeconds = 86400)
    private LocalDateTime ttlAnchor;
}