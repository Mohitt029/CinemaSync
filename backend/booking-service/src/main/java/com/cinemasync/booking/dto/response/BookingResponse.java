package com.cinemasync.booking.dto.response;

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
public class BookingResponse {
    private String bookingId;
    private String bookingReference;
    private String status;
    private String movieTitle;
    private String theatreName;
    private String screenName;
    private LocalDateTime showDateTime;
    private List<SeatResponse> seats;
    private double totalAmount;
    private String couponCode;
    private double discountAmount;
    private double finalAmount;
    private String paymentId;
    private LocalDateTime createdAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatResponse {
        private String seatId;
        private String rowName;
        private int number;
        private String category;
        private double price;
    }
}