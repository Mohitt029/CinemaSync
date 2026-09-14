// backend/booking-service/src/main/java/com/cinemasync/booking/model/SeatMatrix.java
package com.cinemasync.booking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "seat_matrices")
public class SeatMatrix {
    @Id
    private String id;
    private String showId;
    private int rows;
    private int cols;
    private Seat[][] matrix;
    private Map<String, Seat> seatMap;
    private Map<String, Set<String>> categorySeats;
    private Map<String, LockInfo> seatLocks;
    private Map<String, Long> lockTimers;
    private long lastUpdated;
    private int totalSeats;
    private int availableSeats;
    private int lockedSeats;
    private int bookedSeats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Seat {
        private String seatId;
        private int row;
        private int col;
        private String rowName;
        private int number;
        private String category;
        private double price;
        private String status;
        private String userId;  // CRITICAL: This must be in JSON response
        private LocalDateTime lockedAt;
        private LocalDateTime expiresAt;
        private int version;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LockInfo {
        private String userId;
        private String seatId;
        private LocalDateTime lockedAt;
        private LocalDateTime expiresAt;
        private String lockId;
    }
}