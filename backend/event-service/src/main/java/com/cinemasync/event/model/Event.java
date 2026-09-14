// backend/event-service/src/main/java/com/cinemasync/event/model/Event.java
package com.cinemasync.event.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "events")
public class Event {
    @Id
    private String id;

    @Indexed
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

    /** Venue coordinates for distance search */
    private Double latitude;
    private Double longitude;

    private List<Showtime> showtimes;
    private String status;
    private boolean featured;

    private Integer totalSeats;
    private Integer availableSeats;
    private Double minPrice;
    private Double maxPrice;
    private List<PriceTier> priceTiers;
    private List<String> tags;
    private Double averageRating;
    private Integer totalReviews;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Showtime {
        private String id;
        private LocalDateTime dateTime;
        private Integer availableSeats;
        private Integer totalSeats;
        private List<PriceTier> priceTiers;
        private String screen;
        private String format;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceTier {
        private String name;
        private Double price;
        private Integer seatsCount;
        private String description;
    }
}