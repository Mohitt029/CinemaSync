// backend/event-service/src/main/java/com/cinemasync/event/dto/response/EventResponse.java
package com.cinemasync.event.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {
    private String id;
    private String title;
    private String description;
    private String category;
    private String genre;
    private Integer duration;
    private String language;
    private String rating;
    private String posterUrl;
    private String trailerUrl;
    private List<String> images;
    private String venueId;
    private String venueName;
    private String address;
    private String city;
    private String state;
    private String country;
    private String pinCode;
    private Double latitude;
    private Double longitude;
    /** Populated only on location search */
    private Double distanceKm;
    private List<ShowtimeResponse> showtimes;
    private String status;
    private boolean featured;
    private Integer totalSeats;
    private Integer availableSeats;
    private Double minPrice;
    private Double maxPrice;
    private List<PriceTierResponse> priceTiers;
    private List<String> tags;
    private Double averageRating;
    private Integer totalReviews;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShowtimeResponse {
        private String id;
        private LocalDateTime dateTime;
        private Integer availableSeats;
        private Integer totalSeats;
        private String screen;
        private String format;
        private List<PriceTierResponse> priceTiers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceTierResponse {
        private String name;
        private Double price;
        private Integer seatsCount;
        private String description;
    }
}