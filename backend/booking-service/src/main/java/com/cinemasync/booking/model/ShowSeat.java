// backend/booking-service/src/main/java/com/cinemasync/booking/model/ShowSeat.java
package com.cinemasync.booking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "show_seats")
@CompoundIndex(name = "show_seat_unique", def = "{'showId': 1, 'seatId': 1}", unique = true)
public class ShowSeat {
    @Id
    private String id;
    private String showId;
    private String seatId;
    private String rowName;
    private int number;
    private String category; // SILVER, GOLD, PLATINUM
    private double price;
    private String status; // AVAILABLE, LOCKED, BOOKED
    private String bookingId;
    private String userId;
    private LocalDateTime lockedAt;
    private LocalDateTime expiresAt;
    private int version; // Optimistic locking
}