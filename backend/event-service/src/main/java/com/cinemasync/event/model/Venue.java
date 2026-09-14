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
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "venues")
public class Venue {
    @Id
    private String id;
    
    @Indexed
    private String name;
    
    private String description;
    
    private String address;
    
    private String city;
    
    private String state;
    
    private String country;
    
    private String pinCode;
    
    private String phone;
    
    private String email;
    
    private String website;
    
    private List<String> images;
    
    private String mapUrl;
    
    private Integer totalSeats;
    
    private List<Section> sections;
    
    private Map<String, Object> amenities;
    
    private String parkingInfo;
    
    private String accessibilityInfo;
    
    private String status;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Section {
        private String id;
        private String name;
        private String description;
        private Integer rows;
        private Integer columns;
        private Integer totalSeats;
        private List<Seat> seats;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Seat {
        private String id;
        private String row;
        private Integer number;
        private String sectionId;
        private String tier;
        private Double price;
        private String status;
    }
}