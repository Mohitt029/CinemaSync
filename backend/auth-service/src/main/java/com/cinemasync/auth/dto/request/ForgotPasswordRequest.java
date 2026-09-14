// backend/auth-service/src/main/java/com/cinemasync/auth/dto/request/ForgotPasswordRequest.java
package com.cinemasync.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
}