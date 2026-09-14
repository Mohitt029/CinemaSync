package com.cinemasync.booking.controller;

import com.cinemasync.booking.dto.request.BookingRequest;
import com.cinemasync.booking.dto.request.SeatLockRequest;
import com.cinemasync.booking.dto.response.BookingResponse;
import com.cinemasync.booking.model.SeatMatrix.Seat;
import com.cinemasync.booking.service.BookingService;
import com.cinemasync.booking.service.SeatAllocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class BookingController {

    private final BookingService bookingService;
    private final SeatAllocationService seatAllocationService;

    // GET availability stays in SeatController only

    @PostMapping("/seats/lock")
    public ResponseEntity<List<Seat>> lockSeats(
            @Valid @RequestBody SeatLockRequest request,
            @RequestHeader("X-User-Id") String userId) {
        log.info("POST /api/seats/lock user={} show={} seats={}",
                userId, request.getShowId(), request.getSeatIds());
        List<Seat> locked = seatAllocationService.lockSeatsBatch(
                request.getShowId(), request.getSeatIds(), userId);
        return ResponseEntity.ok(locked);
    }

    @DeleteMapping("/seats/lock/{showId}/{seatId}")
    public ResponseEntity<Void> releaseLock(
            @PathVariable String showId,
            @PathVariable String seatId,
            @RequestHeader("X-User-Id") String userId) {
        log.info("DELETE /api/seats/lock/{}/{} user={}", showId, seatId, userId);
        seatAllocationService.releaseLock(showId, seatId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bookings")
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            @RequestHeader("X-User-Id") String userId) {
        log.info("POST /api/bookings user={} show={}", userId, request.getShowId());
        BookingResponse response = bookingService.createEnhancedBooking(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable String bookingId) {
        return ResponseEntity.ok(bookingService.getBooking(bookingId));
    }

    @GetMapping("/bookings/user/current")
    public ResponseEntity<List<BookingResponse>> getUserBookings(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(bookingService.getUserBookings(userId));
    }

    @PutMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<BookingResponse> cancelBookingPut(
            @PathVariable String bookingId,
            @RequestHeader("X-User-Id") String userId) {
        log.info("PUT /api/bookings/{}/cancel user={}", bookingId, userId);
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId, userId));
    }

    @PostMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<BookingResponse> cancelBookingPost(
            @PathVariable String bookingId,
            @RequestHeader("X-User-Id") String userId) {
        log.info("POST /api/bookings/{}/cancel user={}", bookingId, userId);
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId, userId));
    }

    @PutMapping("/bookings/{bookingId}/confirm")
    public ResponseEntity<BookingResponse> confirmBooking(
            @PathVariable String bookingId,
            @RequestParam String paymentId) {
        log.info("PUT /api/bookings/{}/confirm paymentId={}", bookingId, paymentId);
        return ResponseEntity.ok(bookingService.confirmBooking(bookingId, paymentId));
    }
}