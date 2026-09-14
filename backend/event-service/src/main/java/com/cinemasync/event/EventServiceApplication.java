// backend/event-service/src/main/java/com/cinemasync/event/EventServiceApplication.java
package com.cinemasync.event;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableMongoAuditing
@EnableCaching
public class EventServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(EventServiceApplication.class, args);
        System.out.println("🎬 CinemaSync Event Service Started Successfully!");
        System.out.println("📊 Database: cinemasync_events");
        System.out.println("🔌 Port: 8082");
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}