// backend/auth-service/src/main/java/com/cinemasync/auth/repository/PasswordResetTokenRepository.java
package com.cinemasync.auth.repository;

import com.cinemasync.auth.model.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);
    void deleteByUserId(String userId);
    void deleteByExpiresAtBefore(LocalDateTime cutoff);
}