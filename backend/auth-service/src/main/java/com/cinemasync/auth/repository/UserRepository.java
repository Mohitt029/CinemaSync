// backend/auth-service/src/main/java/com/cinemasync/auth/repository/UserRepository.java
package com.cinemasync.auth.repository;

import com.cinemasync.auth.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}