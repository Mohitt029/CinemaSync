// backend/event-service/src/main/java/com/cinemasync/event/dto/request/AdvancedSearchRequest.java
package com.cinemasync.event.dto.request;

import lombok.Data;

@Data
public class AdvancedSearchRequest {
    private String keyword;
    private String city;
    private String category;
    private String language;
    private String genre;
    private String format;
    private Double minPrice;
    private Double maxPrice;
    private String date;       // yyyy-MM-dd
    private String timeSlot;   // MORNING | AFTERNOON | EVENING | NIGHT
    private Double lat;
    private Double lng;
    private Double radiusKm;
    private String sortBy;     // distance | price | date | featured
}