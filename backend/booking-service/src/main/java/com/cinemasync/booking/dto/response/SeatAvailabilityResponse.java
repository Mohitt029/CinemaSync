package com.cinemasync.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatAvailabilityResponse {
    private String showId;
    private int totalSeats;
    private int availableSeats;
    private int lockedSeats;
    private int bookedSeats;
    private List<SeatInfo> seats;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatInfo {
        private String seatId;
        private String rowName;
        private int number;
        private String category;
        private double price;
        private String status; // AVAILABLE, LOCKED, BOOKED
        private String lockedBy; // null if not locked
    }
}