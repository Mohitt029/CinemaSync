// backend/booking-service/src/main/java/com/cinemasync/booking/model/Booking.java
package com.cinemasync.booking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {
    @Id
    private String id;
    
    private String userId;
    private String showId;
    private String showTime;
    private String movieId;
    private String movieTitle;
    private String theatreId;
    private String theatreName;
    private String screenName;
    private List<String> seatIds;
    private List<SeatDetail> seatDetails;
    private double totalAmount;
    private String couponCode;
    private double discountAmount;
    private double finalAmount;
    private String status; // PENDING, CONFIRMED, CANCELLED, FAILED
    private String paymentId;
    private String paymentOrderId;
    private String bookingReference;
    
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
    private LocalDateTime bookingTime;
    private LocalDateTime showDateTime;
    private LocalDateTime holdExpiresAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatDetail {
        private String seatId;
        private String rowName;
        private int number;
        private String category; // SILVER, GOLD, PLATINUM
        private double price;
    }
}
