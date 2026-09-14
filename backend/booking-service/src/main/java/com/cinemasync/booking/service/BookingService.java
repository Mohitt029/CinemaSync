// backend/booking-service/src/main/java/com/cinemasync/booking/service/BookingService.java
package com.cinemasync.booking.service;

import com.cinemasync.booking.dto.request.BookingRequest;
import com.cinemasync.booking.dto.response.BookingResponse;
import com.cinemasync.booking.model.Booking;
import com.cinemasync.booking.model.Booking.SeatDetail;
import com.cinemasync.booking.model.Coupon;
import com.cinemasync.booking.model.SeatMatrix;
import com.cinemasync.booking.model.SeatMatrix.Seat;
import com.cinemasync.booking.repository.BookingRepository;
import com.cinemasync.booking.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CouponRepository couponRepository;
    private final SeatAllocationService seatAllocationService;

    @Transactional
    public BookingResponse createEnhancedBooking(BookingRequest request, String userId) {
        log.info("Creating booking for user: {}, show: {}", userId, request.getShowId());

        SeatMatrix matrix = seatAllocationService.getSeatMatrixWithExpiryCheck(request.getShowId());

        for (String seatId : request.getSeatIds()) {
            Seat seat = matrix.getSeatMap().get(seatId);
            if (seat == null) {
                throw new RuntimeException("Seat " + seatId + " not found");
            }
            if (!"LOCKED".equals(seat.getStatus()) || !userId.equals(seat.getUserId())) {
                throw new RuntimeException("Seat " + seatId + " is not locked by this user");
            }
            if (seat.getExpiresAt() != null && seat.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Seat " + seatId + " lock has expired");
            }
        }

        List<Seat> seats = request.getSeatIds().stream()
                .map(id -> matrix.getSeatMap().get(id))
                .collect(Collectors.toList());

        double totalAmount = seats.stream().mapToDouble(Seat::getPrice).sum();
        double discountAmount = 0;
        String couponCode = null;

        if (request.getCouponCode() != null && !request.getCouponCode().isEmpty()) {
            Coupon coupon = couponRepository.findByCode(request.getCouponCode())
                    .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

            if (!"ACTIVE".equals(coupon.getStatus())) {
                throw new RuntimeException("Coupon is not active");
            }
            if (coupon.getUsedCount() >= coupon.getUsageLimit()) {
                throw new RuntimeException("Coupon usage limit exceeded");
            }
            if (totalAmount < coupon.getMinOrderAmount()) {
                throw new RuntimeException("Minimum order amount not met");
            }

            discountAmount = totalAmount * (coupon.getDiscountPercent() / 100);
            discountAmount = Math.min(discountAmount, coupon.getMaxDiscountAmount());
            couponCode = coupon.getCode();

            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        double finalAmount = totalAmount - discountAmount;
        String bookingReference = "BKG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Booking booking = Booking.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .showId(request.getShowId())
                .bookingReference(bookingReference)
                .seatIds(request.getSeatIds())
                .seatDetails(seats.stream()
                        .map(s -> SeatDetail.builder()
                                .seatId(s.getSeatId())
                                .rowName(s.getRowName())
                                .number(s.getNumber())
                                .category(s.getCategory())
                                .price(s.getPrice())
                                .build())
                        .collect(Collectors.toList()))
                .totalAmount(totalAmount)
                .couponCode(couponCode)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .status("PENDING")
                .bookingTime(LocalDateTime.now())
                .holdExpiresAt(LocalDateTime.now().plusMinutes(10))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        booking = bookingRepository.save(booking);

        // ✅ FIX: DO NOT call bookSeat() here. The seat stays LOCKED.
        // It will only become BOOKED when confirmBooking() is called
        // after successful Razorpay signature verification.
        log.info("Booking created PENDING (seats remain LOCKED): {}", booking.getId());
        return mapToResponse(booking);
    }

    public BookingResponse getBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return mapToResponse(booking);
    }

    public List<BookingResponse> getUserBookings(String userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse cancelBooking(String bookingId, String userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUserId().equals(userId)) {
            throw new RuntimeException("User does not own this booking");
        }
        if ("CANCELLED".equals(booking.getStatus())) {
            log.info("Booking {} already cancelled — idempotent no-op", bookingId);
            return mapToResponse(booking);
        }
        // Allow cancelling PENDING bookings anytime (Razorpay cancel, abandoned etc.)
        // Only apply 2-hour cutoff to CONFIRMED bookings
        if ("CONFIRMED".equals(booking.getStatus())
                && booking.getShowDateTime() != null
                && booking.getShowDateTime().minusHours(2).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cancellation not allowed within 2 hours of show");
        }

        // ✅ FIX: release seats based on their CURRENT state
        // LOCKED -> releaseLock, BOOKED -> releaseBookedSeats
        seatAllocationService.releaseSeatsForBooking(
                booking.getShowId(), booking.getSeatIds(), userId);

        booking.setStatus("CANCELLED");
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        log.info("Booking cancelled: {}", bookingId);
        return mapToResponse(booking);
    }

    /**
     * Idempotent payment confirmation.
     * ✅ FIX: This is the ONLY place where seats transition LOCKED -> BOOKED.
     */
    @Transactional
    public BookingResponse confirmBooking(String bookingId, String paymentId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if ("CONFIRMED".equals(booking.getStatus())) {
            if (paymentId != null && paymentId.equals(booking.getPaymentId())) {
                log.info("Idempotent confirm for booking {}", bookingId);
                return mapToResponse(booking);
            }
            throw new RuntimeException("Booking already confirmed with a different payment");
        }
        if ("CANCELLED".equals(booking.getStatus())) {
            throw new RuntimeException("Cannot confirm a cancelled booking");
        }
        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Booking is not in PENDING state: " + booking.getStatus());
        }

        // ✅ FIX: NOW mark seats as BOOKED (was previously done too early)
        for (String seatId : booking.getSeatIds()) {
            try {
                seatAllocationService.bookSeat(
                        booking.getShowId(), seatId, booking.getUserId(), bookingId);
            } catch (Exception e) {
                log.warn("Could not book seat {} during confirm: {}", seatId, e.getMessage());
                // If lock expired, don't fail the whole confirm — user paid already.
                // Optionally: mark booking as REFUND_NEEDED.
            }
        }

        booking.setStatus("CONFIRMED");
        booking.setPaymentId(paymentId);
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        log.info("Booking confirmed: {} paymentId={}", bookingId, paymentId);
        return mapToResponse(booking);
    }

    public List<Seat> recommendSeats(String showId, int seatCount, String preferredCategory) {
        return seatAllocationService.findBestAvailableSeats(showId, seatCount, preferredCategory);
    }

    private BookingResponse mapToResponse(Booking booking) {
        List<BookingResponse.SeatResponse> seatResponses =
                booking.getSeatDetails() == null
                        ? Collections.emptyList()
                        : booking.getSeatDetails().stream()
                        .map(s -> BookingResponse.SeatResponse.builder()
                                .seatId(s.getSeatId())
                                .rowName(s.getRowName())
                                .number(s.getNumber())
                                .category(s.getCategory())
                                .price(s.getPrice())
                                .build())
                        .collect(Collectors.toList());

        return BookingResponse.builder()
                .bookingId(booking.getId())
                .bookingReference(booking.getBookingReference())
                .status(booking.getStatus())
                .movieTitle(booking.getMovieTitle())
                .theatreName(booking.getTheatreName())
                .screenName(booking.getScreenName())
                .showDateTime(booking.getShowDateTime())
                .seats(seatResponses)
                .totalAmount(booking.getTotalAmount())
                .couponCode(booking.getCouponCode())
                .discountAmount(booking.getDiscountAmount())
                .finalAmount(booking.getFinalAmount())
                .paymentId(booking.getPaymentId())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}