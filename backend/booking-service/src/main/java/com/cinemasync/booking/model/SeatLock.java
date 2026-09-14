// backend/booking-service/src/main/java/com/cinemasync/booking/model/SeatLock.java
package com.cinemasync.booking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "seat_locks")
public class SeatLock {
    @Id
    private String id;
    private String showId;
    private String userId;
    private List<String> seatIds;
    private LocalDateTime lockedAt;
    private LocalDateTime expiresAt;
    private String status; // ACTIVE, EXPIRED, RELEASED
}