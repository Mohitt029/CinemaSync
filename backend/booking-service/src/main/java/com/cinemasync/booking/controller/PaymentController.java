package com.cinemasync.booking.controller;

import com.cinemasync.booking.service.BookingService;
import com.cinemasync.booking.service.RazorpayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final RazorpayService razorpayService;
    private final BookingService bookingService;

    /** Used by PaymentStep to enable/disable Pay button */
    @GetMapping("/status")
    public ResponseEntity<?> status() {
        boolean ok = razorpayService.isConfigured();
        log.debug("GET /api/payments/status configured={}", ok);
        return ResponseEntity.ok(Map.of("razorpayConfigured", ok));
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, String> body) {
        String bookingId = body.get("bookingId");
        log.info("POST /api/payments/create-order bookingId={}", bookingId);
        try {
            Map<String, Object> order = razorpayService.createOrder(bookingId);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            log.error("Create order failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> body) {
        log.info("POST /api/payments/verify bookingId={}", body.get("bookingId"));
        try {
            String bookingId = body.get("bookingId");
            String orderId = body.get("razorpay_order_id");
            String paymentId = body.get("razorpay_payment_id");
            String signature = body.get("razorpay_signature");

            if (orderId == null || paymentId == null || signature == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing razorpay_order_id / payment_id / signature"));
            }

            boolean ok = razorpayService.verifySignature(orderId, paymentId, signature);
            if (!ok) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid payment signature"));
            }

            var confirmed = bookingService.confirmBooking(bookingId, paymentId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "booking", confirmed,
                    "paymentId", paymentId
            ));
        } catch (Exception e) {
            log.error("Verify failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}