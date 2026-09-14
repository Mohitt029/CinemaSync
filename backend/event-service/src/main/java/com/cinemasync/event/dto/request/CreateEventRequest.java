// backend/event-service/src/main/java/com/cinemasync/event/dto/request/CreateEventRequest.java
package com.cinemasync.event.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
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
public class CreateEventRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String description;
    @NotBlank
    private String category;
    private String genre;
    @Positive
    private Integer duration;
    private String language;
    private String rating;
    private String posterUrl;
    private List<String> images;
    @NotBlank
    private String venueId;
    private String venueName;
    private String address;
    @NotBlank
    private String city;
    private String state;
    private String country;
    private Double latitude;
    private Double longitude;
    private List<ShowtimeRequest> showtimes;
    private List<PriceTierRequest> priceTiers;
    private List<String> tags;
    private boolean featured;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShowtimeRequest {
        private LocalDateTime dateTime;
        private Integer totalSeats;
        private String screen;
        private String format;
        private List<PriceTierRequest> priceTiers;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceTierRequest {
        private String name;
        private Double price;
        private Integer seatsCount;
        private String description;
    }
}