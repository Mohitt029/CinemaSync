// backend/auth-service/src/main/java/com/cinemasync/auth/AuthServiceApplication.java
package com.cinemasync.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
        System.out.println("🚀 CinemaSync Auth Service Started Successfully!");
        System.out.println("📊 Database: cinemasync_auth");
        System.out.println("🔌 MongoDB Atlas Connected");
    }
}