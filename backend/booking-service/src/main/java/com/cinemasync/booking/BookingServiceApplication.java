package com.cinemasync.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BookingServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BookingServiceApplication.class, args);
        System.out.println("🎫 CinemaSync Booking Service Started Successfully!");
        System.out.println("📊 Database: cinemasync_bookings");
        System.out.println("🔌 Port: 8084");
    }
}