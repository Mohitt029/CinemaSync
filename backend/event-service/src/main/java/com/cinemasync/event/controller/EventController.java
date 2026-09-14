// backend/event-service/src/main/java/com/cinemasync/event/controller/EventController.java
package com.cinemasync.event.controller;

import com.cinemasync.event.dto.request.AdvancedSearchRequest;
import com.cinemasync.event.dto.request.CreateEventRequest;
import com.cinemasync.event.dto.response.EventResponse;
import com.cinemasync.event.exception.EventNotFoundException;
import com.cinemasync.event.model.Event;
import com.cinemasync.event.repository.EventRepository;
import com.cinemasync.event.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class EventController {
    private final EventService eventService;
    private final EventRepository eventRepository;

    @PostMapping
    public ResponseEntity<?> createEvent(@Valid @RequestBody CreateEventRequest request) {
        try {
            log.info("Received create event request: {}", request.getTitle());
            EventResponse response = eventService.createEvent(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error creating event: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create event", "message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable String id) {
        try {
            log.info("Fetching event by id: {}", id);
            EventResponse response = eventService.getEventById(id);
            return ResponseEntity.ok(response);
        } catch (EventNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Event not found", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching event: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch event", "message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllEvents(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            log.info("Fetching all events page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
            Page<EventResponse> response = eventService.getAllEvents(pageable);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching events: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch events", "message", e.getMessage()));
        }
    }

    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingEvents() {
        try {
            return ResponseEntity.ok(eventService.getUpcomingEvents());
        } catch (Exception e) {
            log.error("Error fetching upcoming events: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch upcoming events", "message", e.getMessage()));
        }
    }

    @GetMapping("/featured")
    public ResponseEntity<?> getFeaturedEvents() {
        try {
            return ResponseEntity.ok(eventService.getFeaturedEvents());
        } catch (Exception e) {
            log.error("Error fetching featured events: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch featured events", "message", e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchEvents(
            @RequestParam String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        try {
            log.info("Searching events with keyword: {}", keyword);
            Page<EventResponse> response = eventService.searchEvents(keyword, pageable);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error searching events: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Search failed", "message", e.getMessage()));
        }
    }

    /**
     * BookMyShow-style advanced search:
     * keyword, city, category, language, genre, format, price, date, timeSlot,
     * lat/lng + radiusKm (default sort by distance nearest-first)
     */
    @GetMapping("/search/advanced")
    public ResponseEntity<?> advancedSearch(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String format,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String timeSlot,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "50") Double radiusKm,
            @RequestParam(required = false, defaultValue = "distance") String sortBy) {
        try {
            AdvancedSearchRequest req = new AdvancedSearchRequest();
            req.setKeyword(keyword);
            req.setCity(city);
            req.setCategory(category);
            req.setLanguage(language);
            req.setGenre(genre);
            req.setFormat(format);
            req.setMinPrice(minPrice);
            req.setMaxPrice(maxPrice);
            req.setDate(date);
            req.setTimeSlot(timeSlot);
            req.setLat(lat);
            req.setLng(lng);
            req.setRadiusKm(radiusKm);
            req.setSortBy(sortBy);
            List<EventResponse> results = eventService.advancedSearch(req);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("Advanced search failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Advanced search failed", "message", e.getMessage()));
        }
    }

    @GetMapping("/filter")
    public ResponseEntity<?> getEventsByCategoryAndCity(
            @RequestParam String category,
            @RequestParam String city) {
        try {
            return ResponseEntity.ok(eventService.getEventsByCategoryAndCity(category, city));
        } catch (Exception e) {
            log.error("Error filtering events: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Filter failed", "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(
            @PathVariable String id,
            @Valid @RequestBody CreateEventRequest request) {
        try {
            return ResponseEntity.ok(eventService.updateEvent(id, request));
        } catch (EventNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Event not found", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating event: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update event", "message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable String id) {
        try {
            eventService.deleteEvent(id);
            return ResponseEntity.noContent().build();
        } catch (EventNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Event not found", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting event: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete event", "message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/debug")
    public ResponseEntity<?> debugEvent(@PathVariable String id) {
        try {
            Event event = eventRepository.findById(id)
                    .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + id));
            Map<String, Object> debug = new HashMap<>();
            debug.put("eventId", event.getId());
            debug.put("title", event.getTitle());
            debug.put("city", event.getCity());
            debug.put("latitude", event.getLatitude());
            debug.put("longitude", event.getLongitude());
            debug.put("showtimes", event.getShowtimes());
            debug.put("showtimesCount", event.getShowtimes() != null ? event.getShowtimes().size() : 0);
            return ResponseEntity.ok(debug);
        } catch (EventNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Event not found", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error debugging event: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Debug failed", "message", e.getMessage()));
        }
    }
}