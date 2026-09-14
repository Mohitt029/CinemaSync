package com.cinemasync.booking.controller;

import com.cinemasync.booking.model.SeatMatrix;
import com.cinemasync.booking.model.SeatMatrix.Seat;
import com.cinemasync.booking.service.SeatAllocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/seats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class SeatController {

    private final SeatAllocationService seatAllocationService;

    /**
     * Single source of truth for the seat map UI.
     * - Expiry-check demotes stale locks at read time
     * - Each seat gets lockedBy (= userId when LOCKED) so other users see grey
     * - Counts recomputed from live seat statuses
     */
    @GetMapping("/show/{showId}/availability")
    public ResponseEntity<Map<String, Object>> getSeatAvailability(
            @PathVariable String showId,
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId) {

        log.info("GET /api/seats/show/{}/availability viewer={}", showId, currentUserId);
        Map<String, Object> body = new LinkedHashMap<>();

        try {
            SeatMatrix matrix = seatAllocationService.getSeatMatrixWithExpiryCheck(showId);

            int available = 0, locked = 0, booked = 0;
            List<Map<String, Object>> seatDtos = new ArrayList<>();

            for (Seat seat : matrix.getSeatMap().values()) {
                String status = seat.getStatus() != null ? seat.getStatus() : "AVAILABLE";
                String owner = seat.getUserId();
                String lockedBy = "LOCKED".equals(status) && owner != null ? owner : null;

                switch (status) {
                    case "AVAILABLE" -> available++;
                    case "LOCKED" -> locked++;
                    case "BOOKED" -> booked++;
                    default -> { }
                }

                Map<String, Object> dto = new LinkedHashMap<>();
                dto.put("seatId", seat.getSeatId());
                dto.put("row", seat.getRow());
                dto.put("col", seat.getCol());
                dto.put("rowName", seat.getRowName());
                dto.put("number", seat.getNumber());
                dto.put("category", seat.getCategory());
                dto.put("price", seat.getPrice());
                dto.put("status", status);
                dto.put("userId", owner);
                dto.put("lockedBy", lockedBy);
                dto.put("lockedAt", seat.getLockedAt());
                dto.put("expiresAt", seat.getExpiresAt());
                dto.put("version", seat.getVersion());
                dto.put("isMine",
                        currentUserId != null
                                && "LOCKED".equals(status)
                                && currentUserId.equals(owner));
                seatDtos.add(dto);
            }

            body.put("showId", showId);
            body.put("totalSeats", matrix.getTotalSeats() > 0 ? matrix.getTotalSeats() : seatDtos.size());
            body.put("availableSeats", available);
            body.put("lockedSeats", locked);
            body.put("bookedSeats", booked);
            body.put("rows", matrix.getRows());
            body.put("cols", matrix.getCols());
            body.put("seats", seatDtos);
            return ResponseEntity.ok(body);

        } catch (Exception e) {
            log.warn("Availability failed for {}: {}", showId, e.getMessage());
            body.put("showId", showId);
            body.put("totalSeats", 0);
            body.put("availableSeats", 0);
            body.put("lockedSeats", 0);
            body.put("bookedSeats", 0);
            body.put("rows", 0);
            body.put("cols", 0);
            body.put("seats", List.of());
            return ResponseEntity.ok(body);
        }
    }

    @GetMapping("/recommend")
    public ResponseEntity<List<Seat>> recommendSeats(
            @RequestParam String showId,
            @RequestParam int count,
            @RequestParam(required = false) String category) {
        log.info("GET /api/seats/recommend show={} count={} category={}", showId, count, category);
        return ResponseEntity.ok(
                seatAllocationService.findBestAvailableSeats(showId, count, category));
    }
}