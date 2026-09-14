// backend/auth-service/src/main/java/com/cinemasync/auth/exception/UserAlreadyExistsException.java
package com.cinemasync.auth.exception;

public class UserAlreadyExistsException extends RuntimeException {
    public UserAlreadyExistsException(String message) {
        super(message);
    }
}