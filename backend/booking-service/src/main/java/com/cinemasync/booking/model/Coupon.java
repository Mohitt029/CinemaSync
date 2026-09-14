// backend/booking-service/src/main/java/com/cinemasync/booking/model/Coupon.java
package com.cinemasync.booking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "coupons")
public class Coupon {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String code;
    
    private String description;
    private double discountPercent;
    private double maxDiscountAmount;
    private double minOrderAmount;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private int usageLimit;
    private int usedCount;
    private String status; // ACTIVE, EXPIRED, DISABLED
}