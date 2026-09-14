// backend/booking-service/src/main/java/com/cinemasync/booking/controller/AdminBookingController.java
package com.cinemasync.booking.controller;

import com.cinemasync.booking.model.Booking;
import com.cinemasync.booking.repository.BookingRepository;
import com.cinemasync.booking.service.BookingService;
import com.cinemasync.booking.service.SeatAllocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminBookingController {

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final SeatAllocationService seatAllocationService;

    private void requireAdmin(String role) {
        if (role == null || !role.toUpperCase().contains("ADMIN")) {
            throw new RuntimeException("Admin only");
        }
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        List<Booking> all = bookingRepository.findAll();
        long confirmed = all.stream().filter(b -> "CONFIRMED".equals(b.getStatus())).count();
        long pending = all.stream().filter(b -> "PENDING".equals(b.getStatus())).count();
        long cancelled = all.stream().filter(b -> "CANCELLED".equals(b.getStatus())).count();

        double revenue = all.stream()
                .filter(b -> "CONFIRMED".equals(b.getStatus()))
                .mapToDouble(Booking::getFinalAmount)
                .sum();

        Map<String, Object> body = new HashMap<>();
        body.put("totalBookings", all.size());
        body.put("confirmed", confirmed);
        body.put("pending", pending);
        body.put("cancelled", cancelled);
        body.put("revenueInr", revenue);
        return ResponseEntity.ok(body);
    }

    /**
     * Paginated bookings.
     * Example: GET /api/admin/bookings?page=0&size=20&status=CONFIRMED
     * Response: Spring Page JSON (content, totalElements, totalPages, number, size, ...)
     */
  @GetMapping("/bookings")
public ResponseEntity<Page<Booking>> listBookings(
        @RequestHeader(value = "X-User-Role", required = false) String role,
        @RequestParam(required = false) String status,
        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
        Pageable pageable) {

    requireAdmin(role);
    log.info("Admin bookings page={} size={} status={}",
            pageable.getPageNumber(), pageable.getPageSize(), status);

    Page<Booking> page;
    if (status != null && !status.isBlank()) {
        page = bookingRepository.findByStatus(status.trim().toUpperCase(), pageable);
    } else {
        page = bookingRepository.findAll(pageable);
    }
    return ResponseEntity.ok(page);
}

    @PostMapping("/seats/init")
    public ResponseEntity<?> initSeats(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam String showId,
            @RequestParam(defaultValue = "10") int rows,
            @RequestParam(defaultValue = "10") int cols) {
        requireAdmin(role);

        Map<String, Double> categoryPrices = new HashMap<>();
        categoryPrices.put("SILVER", 250.0);
        categoryPrices.put("GOLD", 400.0);
        categoryPrices.put("PLATINUM", 600.0);

        Map<String, String> categoryRows = new HashMap<>();
        categoryRows.put("PLATINUM", "0-2");
        categoryRows.put("GOLD", "3-5");
        categoryRows.put("SILVER", "6-9");

        var matrix = seatAllocationService.initializeSeatMatrix(
                showId, rows, cols, categoryPrices, categoryRows);
        return ResponseEntity.ok(matrix);
    }
}