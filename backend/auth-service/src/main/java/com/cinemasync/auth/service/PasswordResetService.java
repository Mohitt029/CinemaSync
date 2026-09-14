// backend/auth-service/src/main/java/com/cinemasync/auth/service/PasswordResetService.java
package com.cinemasync.auth.service;

import com.cinemasync.auth.model.PasswordResetToken;
import com.cinemasync.auth.model.User;
import com.cinemasync.auth.repository.PasswordResetTokenRepository;
import com.cinemasync.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.password-reset.token-ttl-minutes:15}")
    private long tokenTtlMinutes;

    @Value("${app.password-reset.from-email:noreply@cinemasync.app}")
    private String fromEmail;

    @Value("${app.password-reset.from-name:CinemaSync}")
    private String fromName;

    @Value("${app.password-reset.reply-to:noreply@cinemasync.app}")
    private String replyTo;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * Always returns 200 to the caller (never reveals whether the email exists).
     * If it does exist, we generate a one-time token, store its hash, email the raw token.
     */
    public void requestReset(String emailRaw, String requestedIp) {
        String email = emailRaw == null ? "" : emailRaw.trim().toLowerCase();
        if (email.isBlank()) return;

        Optional<User> userOpt = userRepository.findByEmail(email);

        // Silently return — do not leak existence
        if (userOpt.isEmpty()) {
            log.info("Forgot-password requested for unknown email (ignored): {}", email);
            return;
        }

        User user = userOpt.get();

        // Google-only users can't reset a password; silently succeed
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            log.info("Forgot-password requested for Google-only account (ignored): {}", email);
            return;
        }

        // Invalidate any existing tokens for this user (one live token at a time)
        try {
            tokenRepository.deleteByUserId(user.getId());
        } catch (Exception e) {
            log.warn("Could not clear old reset tokens: {}", e.getMessage());
        }

        String rawToken = generateRawToken();
        String tokenHash = sha256Hex(rawToken);

        PasswordResetToken reset = PasswordResetToken.builder()
                .tokenHash(tokenHash)
                .userId(user.getId())
                .email(email)
                .expiresAt(LocalDateTime.now().plusMinutes(tokenTtlMinutes))
                .used(false)
                .createdAt(LocalDateTime.now())
                .requestedIp(requestedIp)
                .ttlAnchor(LocalDateTime.now().plusMinutes(tokenTtlMinutes + 1440)) // 24h after expiry
                .build();
        tokenRepository.save(reset);

        String resetUrl = frontendUrl + "/reset-password?token=" + rawToken;

        try {
            sendResetEmail(user, resetUrl);
            log.info("Password reset email sent to {}", email);
        } catch (Exception e) {
            log.error("Failed to send reset email to {}: {}", email, e.getMessage(), e);
            // don't fail the caller — still 200 (no info leak)
        }
    }

    /**
     * Verifies the token, updates the password, marks the token as used.
     * @throws IllegalStateException if token is invalid / expired / used
     */
    public void resetPassword(String rawToken, String newPassword) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalStateException("Reset token is required");
        }

        String tokenHash = sha256Hex(rawToken);
        PasswordResetToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalStateException("Invalid or expired reset link"));

        if (token.isUsed()) {
            throw new IllegalStateException("This reset link has already been used");
        }
        if (token.getExpiresAt() == null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("This reset link has expired. Please request a new one.");
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new IllegalStateException("User no longer exists"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        // If this was a Google-linked user who had no password, set provider to LOCAL now
        if (user.getAuthProvider() == null || "GOOGLE".equals(user.getAuthProvider())) {
            if (user.getGoogleId() != null) {
                user.setAuthProvider("GOOGLE"); // keep google, now they also have a password
            } else {
                user.setAuthProvider("LOCAL");
            }
        }
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        token.setUsed(true);
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);

        log.info("Password reset successful for {}", user.getEmail());
    }

    // ---------- helpers ----------

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        // URL-safe Base64 without padding
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Hash failure", e);
        }
    }

    private void sendResetEmail(User user, String resetUrl) throws Exception {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");

        helper.setFrom(fromEmail, fromName);
        helper.setTo(user.getEmail());
        helper.setReplyTo(replyTo);
        helper.setSubject("Reset your CinemaSync password");

        String safeName = user.getName() != null ? user.getName() : "there";
        String html = buildResetEmailHtml(safeName, resetUrl, tokenTtlMinutes);

        helper.setText(buildPlainText(safeName, resetUrl), html);

        mailSender.send(msg);
    }

    private String buildPlainText(String name, String url) {
        return "Hi " + name + ",\n\n"
             + "We received a request to reset your CinemaSync password.\n\n"
             + "Reset it here (valid for " + tokenTtlMinutes + " minutes):\n"
             + url + "\n\n"
             + "If you didn't request this, you can safely ignore this email.\n\n"
             + "— CinemaSync";
    }

    private String buildResetEmailHtml(String name, String url, long ttlMinutes) {
        String template = """
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Reset your CinemaSync password</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1e;font-family:'Inter','Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0"
               style="max-width:560px;background:#16162a;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:0;height:4px;background:linear-gradient(90deg,#e50914,#667eea,#e50914);"></td>
          </tr>
          <tr>
            <td style="padding:40px 40px 24px 40px;text-align:center;">
              <div style="display:inline-block;padding:12px;border-radius:14px;background:linear-gradient(135deg,#e50914,#b20710);">
                <span style="font-size:28px;">&#127916;</span>
              </div>
              <h1 style="margin:16px 0 4px 0;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                CinemaSync
              </h1>
              <p style="margin:0;color:#a7a7c7;font-size:14px;">Password reset request</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <h2 style="margin:0 0 8px 0;color:#ffffff;font-size:20px;font-weight:700;">
                Hi {{NAME}},
              </h2>
              <p style="margin:0 0 20px 0;color:#c9c9dd;line-height:1.55;font-size:15px;">
                We received a request to reset the password for your CinemaSync account.
                Click the button below to choose a new one.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center" style="border-radius:12px;background:linear-gradient(135deg,#e50914,#b20710);">
                    <a href="{{URL}}" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:12px;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;color:#a7a7c7;font-size:13px;">
                Or paste this link into your browser:
              </p>
              <p style="margin:0 0 24px 0;word-break:break-all;color:#7f7fa8;font-size:12px;font-family:monospace;">
                {{URL}}
              </p>
              <div style="padding:14px 16px;border-radius:10px;background:rgba(229,9,20,0.10);border:1px solid rgba(229,9,20,0.28);">
                <p style="margin:0;color:#ffb3b3;font-size:13px;">
                  &#9201; This link expires in <strong>{{TTL}}</strong> minutes and can only be used once.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 32px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;color:#8a8aa3;font-size:12px;line-height:1.5;">
                If you didn't request this, you can safely ignore this email — your password won't change.
              </p>
              <p style="margin:16px 0 0 0;color:#5e5e78;font-size:11px;">
                CinemaSync &middot; India's premium ticketing platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""";

        return template
                .replace("{{NAME}}", name == null ? "there" : name)
                .replace("{{URL}}", url)
                .replace("{{TTL}}", String.valueOf(ttlMinutes));
    }
}