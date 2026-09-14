// backend/event-service/src/main/java/com/cinemasync/event/service/EventService.java
package com.cinemasync.event.service;

import com.cinemasync.event.dto.request.AdvancedSearchRequest;
import com.cinemasync.event.dto.request.CreateEventRequest;
import com.cinemasync.event.dto.response.EventResponse;
import com.cinemasync.event.exception.EventNotFoundException;
import com.cinemasync.event.model.Event;
import com.cinemasync.event.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final RestTemplate restTemplate;

    @Value("${booking.service.url:http://localhost:8084}")
    private String bookingServiceUrl;

    private static final String SEAT_INIT_ENDPOINT = "/api/seats/init";

    public EventResponse createEvent(CreateEventRequest request) {
        log.info("Creating new event: {}", request.getTitle());
        try {
            Event event = mapToEvent(request);
            event.setCreatedAt(LocalDateTime.now());
            event.setUpdatedAt(LocalDateTime.now());
            event.setStatus("UPCOMING");

            if (event.getShowtimes() != null) {
                event.getShowtimes().forEach(showtime -> {
                    if (showtime.getId() == null) {
                        showtime.setId(UUID.randomUUID().toString());
                    }
                    showtime.setAvailableSeats(showtime.getTotalSeats());
                });
                int total = event.getShowtimes().stream()
                        .mapToInt(s -> s.getTotalSeats() != null ? s.getTotalSeats() : 0)
                        .sum();
                event.setTotalSeats(total);
                event.setAvailableSeats(total);
            }

            if (event.getPriceTiers() != null && !event.getPriceTiers().isEmpty()) {
                event.setMinPrice(event.getPriceTiers().stream()
                        .mapToDouble(Event.PriceTier::getPrice).min().orElse(0.0));
                event.setMaxPrice(event.getPriceTiers().stream()
                        .mapToDouble(Event.PriceTier::getPrice).max().orElse(0.0));
            }

            Event savedEvent = eventRepository.save(event);
            log.info("Event created id={} showtimes={}",
                    savedEvent.getId(),
                    savedEvent.getShowtimes() != null ? savedEvent.getShowtimes().size() : 0);

            if (savedEvent.getShowtimes() != null && !savedEvent.getShowtimes().isEmpty()) {
                for (Event.Showtime showtime : savedEvent.getShowtimes()) {
                    initializeSeatMatrixForShow(showtime.getId(), savedEvent.getCategory());
                }
            }
            return mapToResponse(savedEvent);
        } catch (Exception e) {
            log.error("Failed to create event: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create event: " + e.getMessage());
        }
    }

    private void initializeSeatMatrixForShow(String showId, String category) {
        try {
            log.info("Auto-initializing seat matrix for show: {} category: {}", showId, category);
            Map<String, Object> config = getSeatConfigForCategory(category);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(config, headers);
            String url = bookingServiceUrl + SEAT_INIT_ENDPOINT + "?showId=" + showId + "&rows=10&cols=10";
            restTemplate.postForEntity(url, request, Object.class);
            log.info("Seat matrix initialized for show: {}", showId);
        } catch (Exception e) {
            log.warn("Could not auto-initialize seat matrix for show: {} - {}", showId, e.getMessage());
        }
    }

    private Map<String, Object> getSeatConfigForCategory(String category) {
        Map<String, Object> config = new HashMap<>();
        Map<String, Double> categoryPrices = new HashMap<>();
        Map<String, String> categoryRows = new HashMap<>();
        String cat = category != null ? category.toUpperCase() : "MOVIE";

        switch (cat) {
            case "CONCERT" -> {
                categoryPrices.put("SILVER", 800.0);
                categoryPrices.put("GOLD", 1500.0);
                categoryPrices.put("PLATINUM", 3000.0);
                categoryRows.put("PLATINUM", "0-2");
                categoryRows.put("GOLD", "3-6");
                categoryRows.put("SILVER", "7-11");
            }
            case "SPORTS" -> {
                categoryPrices.put("SILVER", 1500.0);
                categoryPrices.put("GOLD", 2500.0);
                categoryPrices.put("PLATINUM", 5000.0);
                categoryRows.put("PLATINUM", "0-1");
                categoryRows.put("GOLD", "2-4");
                categoryRows.put("SILVER", "5-7");
            }
            case "THEATER" -> {
                categoryPrices.put("SILVER", 300.0);
                categoryPrices.put("GOLD", 500.0);
                categoryPrices.put("PLATINUM", 800.0);
                categoryRows.put("PLATINUM", "0-3");
                categoryRows.put("GOLD", "4-6");
                categoryRows.put("SILVER", "7-9");
            }
            default -> {
                categoryPrices.put("SILVER", 250.0);
                categoryPrices.put("GOLD", 400.0);
                categoryPrices.put("PLATINUM", 600.0);
                categoryRows.put("PLATINUM", "0-2");
                categoryRows.put("GOLD", "3-5");
                categoryRows.put("SILVER", "6-9");
            }
        }
        config.put("categoryPrices", categoryPrices);
        config.put("categoryRows", categoryRows);
        return config;
    }

    public EventResponse getEventById(String id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + id));
        return mapToResponse(event);
    }

    public Page<EventResponse> getAllEvents(Pageable pageable) {
        return eventRepository.findAll(pageable).map(this::mapToResponse);
    }

    public List<EventResponse> getUpcomingEvents() {
        return eventRepository.findUpcomingEvents(LocalDateTime.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<EventResponse> getFeaturedEvents() {
        return eventRepository.findByFeaturedTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<EventResponse> getEventsByCategoryAndCity(String category, String city) {
        return eventRepository.findByCategoryAndCity(category, city).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<EventResponse> searchEvents(String keyword, Pageable pageable) {
        return eventRepository.searchEvents(keyword, pageable).map(this::mapToResponse);
    }

    public List<EventResponse> advancedSearch(AdvancedSearchRequest req) {
        log.info("Advanced search keyword={} city={} lat={} lng={} radius={}",
                req.getKeyword(), req.getCity(), req.getLat(), req.getLng(), req.getRadiusKm());

        List<Event> events;
        if (req.getKeyword() != null && !req.getKeyword().isBlank()) {
            events = eventRepository
                    .searchEvents(req.getKeyword().trim(), Pageable.unpaged())
                    .getContent();
        } else {
            events = eventRepository.findAll();
        }

        Stream<Event> stream = events.stream()
                .filter(e -> e.getStatus() == null
                        || "UPCOMING".equalsIgnoreCase(e.getStatus())
                        || "ONGOING".equalsIgnoreCase(e.getStatus()));

        if (req.getCity() != null && !req.getCity().isBlank()) {
            String c = req.getCity().trim().toLowerCase();
            stream = stream.filter(e ->
                    (e.getCity() != null && e.getCity().toLowerCase().contains(c))
                            || (e.getAddress() != null && e.getAddress().toLowerCase().contains(c))
                            || (e.getVenueName() != null && e.getVenueName().toLowerCase().contains(c)));
        }
        if (req.getCategory() != null && !req.getCategory().isBlank()) {
            stream = stream.filter(e -> req.getCategory().equalsIgnoreCase(e.getCategory()));
        }
        if (req.getLanguage() != null && !req.getLanguage().isBlank()) {
            stream = stream.filter(e -> e.getLanguage() != null
                    && e.getLanguage().toLowerCase().contains(req.getLanguage().toLowerCase()));
        }
        if (req.getGenre() != null && !req.getGenre().isBlank()) {
            stream = stream.filter(e -> e.getGenre() != null
                    && e.getGenre().toLowerCase().contains(req.getGenre().toLowerCase()));
        }
        if (req.getMinPrice() != null) {
            stream = stream.filter(e -> e.getMaxPrice() != null && e.getMaxPrice() >= req.getMinPrice());
        }
        if (req.getMaxPrice() != null) {
            stream = stream.filter(e -> e.getMinPrice() != null && e.getMinPrice() <= req.getMaxPrice());
        }
        if (req.getFormat() != null && !req.getFormat().isBlank()) {
            String fmt = req.getFormat().toUpperCase();
            stream = stream.filter(e -> e.getShowtimes() != null && e.getShowtimes().stream()
                    .anyMatch(s -> s.getFormat() != null && s.getFormat().toUpperCase().contains(fmt)));
        }
        if (req.getDate() != null && !req.getDate().isBlank()) {
            LocalDate day = LocalDate.parse(req.getDate());
            stream = stream.filter(e -> e.getShowtimes() != null && e.getShowtimes().stream()
                    .anyMatch(s -> s.getDateTime() != null && s.getDateTime().toLocalDate().equals(day)));
        }
        if (req.getTimeSlot() != null && !req.getTimeSlot().isBlank()) {
            stream = stream.filter(e -> e.getShowtimes() != null && e.getShowtimes().stream()
                    .anyMatch(s -> matchesTimeSlot(s.getDateTime(), req.getTimeSlot())));
        }

        List<Event> filtered = stream.collect(Collectors.toList());
        Double userLat = req.getLat();
        Double userLng = req.getLng();
        double radius = req.getRadiusKm() != null ? req.getRadiusKm() : 50.0;

        List<EventResponse> results = filtered.stream().map(e -> {
            EventResponse r = mapToResponse(e);
            if (userLat != null && userLng != null
                    && e.getLatitude() != null && e.getLongitude() != null) {
                double d = haversineKm(userLat, userLng, e.getLatitude(), e.getLongitude());
                r.setDistanceKm(Math.round(d * 10.0) / 10.0);
            }
            return r;
        }).collect(Collectors.toList());

        if (userLat != null && userLng != null) {
    // Strict: only venues that have coordinates AND are within radius
    results = results.stream()
            .filter(r -> r.getDistanceKm() != null && r.getDistanceKm() <= radius)
            .collect(Collectors.toList());
}

        String sort = req.getSortBy() != null ? req.getSortBy() : "distance";
        switch (sort) {
            case "price" -> results.sort(Comparator.comparing(
                    r -> r.getMinPrice() != null ? r.getMinPrice() : Double.MAX_VALUE));
            case "featured" -> results.sort((a, b) -> Boolean.compare(b.isFeatured(), a.isFeatured()));
            case "date" -> results.sort(Comparator.comparing(
                    r -> r.getCreatedAt() != null ? r.getCreatedAt() : LocalDateTime.MIN,
                    Comparator.reverseOrder()));
            default -> results.sort(Comparator.comparing(
                    r -> r.getDistanceKm() != null ? r.getDistanceKm() : Double.MAX_VALUE));
        }
        return results;
    }

    private boolean matchesTimeSlot(LocalDateTime dt, String slot) {
        if (dt == null || slot == null) return true;
        int h = dt.getHour();
        return switch (slot.toUpperCase()) {
            case "MORNING" -> h >= 5 && h < 12;
            case "AFTERNOON" -> h >= 12 && h < 17;
            case "EVENING" -> h >= 17 && h < 21;
            case "NIGHT" -> h >= 21 || h < 5;
            default -> true;
        };
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public EventResponse updateEvent(String id, CreateEventRequest request) {
        Event existingEvent = eventRepository.findById(id)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + id));

        Event updatedEvent = mapToEvent(request);
        updatedEvent.setId(id);
        updatedEvent.setCreatedAt(existingEvent.getCreatedAt());
        updatedEvent.setUpdatedAt(LocalDateTime.now());
        updatedEvent.setStatus(existingEvent.getStatus());

        if (updatedEvent.getShowtimes() != null) {
            updatedEvent.getShowtimes().forEach(showtime -> {
                if (showtime.getId() == null) {
                    showtime.setId(UUID.randomUUID().toString());
                }
            });
        }

        Event savedEvent = eventRepository.save(updatedEvent);
        if (savedEvent.getShowtimes() != null) {
            for (Event.Showtime showtime : savedEvent.getShowtimes()) {
                initializeSeatMatrixForShow(showtime.getId(), savedEvent.getCategory());
            }
        }
        return mapToResponse(savedEvent);
    }

    public void deleteEvent(String id) {
        if (!eventRepository.existsById(id)) {
            throw new EventNotFoundException("Event not found with id: " + id);
        }
        eventRepository.deleteById(id);
    }

    private Event mapToEvent(CreateEventRequest request) {
        Event event = new Event();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setCategory(request.getCategory());
        event.setGenre(request.getGenre());
        event.setDuration(request.getDuration());
        event.setLanguage(request.getLanguage());
        event.setRating(request.getRating());
        event.setPosterUrl(request.getPosterUrl());
        event.setImages(request.getImages());
        event.setVenueId(request.getVenueId());
        event.setVenueName(request.getVenueName());
        event.setAddress(request.getAddress());
        event.setCity(request.getCity());
        event.setState(request.getState());
        event.setCountry(request.getCountry());
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setFeatured(request.isFeatured());
        event.setTags(request.getTags());

        if (request.getShowtimes() != null) {
            event.setShowtimes(request.getShowtimes().stream().map(s -> {
                Event.Showtime showtime = new Event.Showtime();
                showtime.setId(UUID.randomUUID().toString());
                showtime.setDateTime(s.getDateTime());
                showtime.setTotalSeats(s.getTotalSeats());
                showtime.setAvailableSeats(s.getTotalSeats());
                showtime.setScreen(s.getScreen());
                showtime.setFormat(s.getFormat());
                return showtime;
            }).collect(Collectors.toList()));
        }

        if (request.getPriceTiers() != null) {
            event.setPriceTiers(request.getPriceTiers().stream().map(p -> {
                Event.PriceTier tier = new Event.PriceTier();
                tier.setName(p.getName());
                tier.setPrice(p.getPrice());
                tier.setSeatsCount(p.getSeatsCount());
                tier.setDescription(p.getDescription());
                return tier;
            }).collect(Collectors.toList()));
        }
        return event;
    }

    private EventResponse mapToResponse(Event event) {
        EventResponse response = EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .category(event.getCategory())
                .genre(event.getGenre())
                .duration(event.getDuration())
                .language(event.getLanguage())
                .rating(event.getRating())
                .posterUrl(event.getPosterUrl())
                .trailerUrl(event.getTrailerUrl())
                .images(event.getImages())
                .venueId(event.getVenueId())
                .venueName(event.getVenueName())
                .address(event.getAddress())
                .city(event.getCity())
                .state(event.getState())
                .country(event.getCountry())
                .pinCode(event.getPinCode())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .status(event.getStatus())
                .featured(event.isFeatured())
                .totalSeats(event.getTotalSeats())
                .availableSeats(event.getAvailableSeats())
                .minPrice(event.getMinPrice())
                .maxPrice(event.getMaxPrice())
                .tags(event.getTags())
                .averageRating(event.getAverageRating())
                .totalReviews(event.getTotalReviews())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();

        if (event.getShowtimes() != null) {
            response.setShowtimes(event.getShowtimes().stream().map(s -> {
                EventResponse.ShowtimeResponse showtime = new EventResponse.ShowtimeResponse();
                showtime.setId(s.getId());
                showtime.setDateTime(s.getDateTime());
                showtime.setAvailableSeats(s.getAvailableSeats());
                showtime.setTotalSeats(s.getTotalSeats());
                showtime.setScreen(s.getScreen());
                showtime.setFormat(s.getFormat());
                return showtime;
            }).collect(Collectors.toList()));
        }

        if (event.getPriceTiers() != null) {
            response.setPriceTiers(event.getPriceTiers().stream().map(p -> {
                EventResponse.PriceTierResponse tier = new EventResponse.PriceTierResponse();
                tier.setName(p.getName());
                tier.setPrice(p.getPrice());
                tier.setSeatsCount(p.getSeatsCount());
                tier.setDescription(p.getDescription());
                return tier;
            }).collect(Collectors.toList()));
        }
        return response;
    }
}