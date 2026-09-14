package com.cinemasync.booking.service;

import com.cinemasync.booking.model.Booking;
import com.cinemasync.booking.repository.BookingRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final BookingRepository bookingRepository;

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    @PostConstruct
    void logConfig() {
        log.info("Razorpay configured? keyId={} secret={}",
                keyId != null && !keyId.isBlank(),
                keySecret != null && !keySecret.isBlank());
    }

    public boolean isConfigured() {
        return keyId != null && !keyId.isBlank()
                && keySecret != null && !keySecret.isBlank();
    }

    public Map<String, Object> createOrder(String bookingId) throws RazorpayException {
        if (!isConfigured()) {
            throw new IllegalStateException("Razorpay not configured (key-id / key-secret)");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!"PENDING".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalStateException("Booking must be PENDING to pay. Current: " + booking.getStatus());
        }

        // Handle both primitive double and Double safely
        double finalAmt = booking.getFinalAmount();
        double totalAmt = booking.getTotalAmount();
        double total = finalAmt > 0 ? finalAmt : totalAmt;

        int amountPaise = (int) Math.round(total * 100);
        if (amountPaise < 100) {
            amountPaise = 100;
        }

        RazorpayClient client = new RazorpayClient(keyId, keySecret);
        JSONObject options = new JSONObject();
        options.put("amount", amountPaise);
        options.put("currency", "INR");
        String receipt = "bk_" + bookingId.replace("-", "");
        if (receipt.length() > 40) {
            receipt = receipt.substring(0, 40);
        }
        options.put("receipt", receipt);

        Order order = client.orders.create(options);
        String orderId = order.get("id").toString();

        try {
            booking.setPaymentOrderId(orderId);
            bookingRepository.save(booking);
        } catch (Exception e) {
            log.warn("Could not save paymentOrderId: {}", e.getMessage());
        }

        log.info("Razorpay order created: {} booking={} amountPaise={}", orderId, bookingId, amountPaise);

        Map<String, Object> res = new HashMap<>();
        res.put("orderId", orderId);
        res.put("amount", amountPaise);
        res.put("currency", "INR");
        res.put("keyId", keyId);
        res.put("bookingId", bookingId);
        return res;
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            boolean ok = sb.toString().equalsIgnoreCase(signature);
            log.info("Razorpay signature verify: {}", ok);
            return ok;
        } catch (Exception e) {
            log.error("Signature verify error: {}", e.getMessage());
            return false;
        }
    }
}