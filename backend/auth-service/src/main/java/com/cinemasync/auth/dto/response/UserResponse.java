package com.cinemasync.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String email;
    private String name;
    private String phone;
    private List<String> roles;
    private boolean emailVerified;
    private String authProvider;
    private String avatarUrl;
    private LocalDateTime createdAt;
}