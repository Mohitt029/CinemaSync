package com.cinemasync.auth.service;

import com.cinemasync.auth.dto.response.AuthResponse;
import com.cinemasync.auth.dto.response.UserResponse;
import com.cinemasync.auth.model.User;
import com.cinemasync.auth.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${google.client-id:}")
    private String googleClientId;

    public AuthResponse loginWithGoogle(String idTokenString) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new RuntimeException("Google Sign-In not configured on server");
        }

        GoogleIdToken.Payload payload = verify(idTokenString);
        String email = payload.getEmail();
        String googleId = payload.getSubject();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");
        Boolean emailVerified = payload.getEmailVerified();

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Google account has no email");
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = User.builder()
                    .email(email)
                    .passwordHash(null)
                    .name(name != null ? name : email.split("@")[0])
                    .googleId(googleId)
                    .authProvider("GOOGLE")
                    .avatarUrl(picture)
                    .roles(List.of("USER"))
                    .enabled(true)
                    .emailVerified(Boolean.TRUE.equals(emailVerified))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .lastLoginAt(LocalDateTime.now())
                    .build();
            user = userRepository.save(user);
            log.info("Created Google user: {}", email);
        } else {
            if (user.getGoogleId() == null) user.setGoogleId(googleId);
            // If user had no password (Google-only), keep provider GOOGLE.
            // If they linked a password later, don't overwrite it.
            if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
                user.setAuthProvider("GOOGLE");
            }
            if (picture != null) user.setAvatarUrl(picture);
            user.setLastLoginAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            if (Boolean.TRUE.equals(emailVerified)) user.setEmailVerified(true);
            user = userRepository.save(user);
            log.info("Google login existing user: {}", email);
        }

        UserDetails userDetails = user;
        String token = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .user(UserResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .name(user.getName())
                        .phone(user.getPhone())
                        .roles(user.getRoles())
                        .emailVerified(user.isEmailVerified())
                        .authProvider(user.getAuthProvider())
                        .avatarUrl(user.getAvatarUrl())
                        .createdAt(user.getCreatedAt())
                        .build())
                .build();
    }

    private GoogleIdToken.Payload verify(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google ID token");
            }
            return idToken.getPayload();
        } catch (Exception e) {
            log.error("Google verify failed: {}", e.getMessage());
            throw new RuntimeException("Google authentication failed");
        }
    }
}