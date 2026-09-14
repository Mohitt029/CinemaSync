// backend/auth-service/src/main/java/com/cinemasync/auth/dto/response/AuthResponse.java
package com.cinemasync.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private UserResponse user;
}