// backend/auth-service/src/main/java/com/cinemasync/auth/exception/AuthenticationException.java
package com.cinemasync.auth.exception;

public class AuthenticationException extends RuntimeException {
    public AuthenticationException(String message) {
        super(message);
    }
}