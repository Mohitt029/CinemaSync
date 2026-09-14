package com.cinemasync.event.controller;

import com.cinemasync.event.dto.request.AdvancedSearchRequest;
import com.cinemasync.event.dto.response.EventResponse;
import com.cinemasync.event.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {

    private final EventService eventService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent}")
    private String geminiApiUrl;

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body) {
        String message = body.get("message") != null ? body.get("message").toString().trim() : "";
        if (message.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "message required"));
        }

        List<EventResponse> events = searchForChat(message);
        String context = buildEventContext(events);

        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                String aiText = callGeminiApi(message, context);
                return ResponseEntity.ok(Map.of(
                        "reply", aiText,
                        "events", events.stream().limit(5).collect(Collectors.toList()),
                        "source", "gemini"
                ));
            } catch (Exception e) {
                log.warn("Gemini failed, falling back: {}", e.getMessage());
            }
        }

        String fallback = fallbackReply(message, events);
        return ResponseEntity.ok(Map.of(
                "reply", fallback,
                "events", events.stream().limit(5).collect(Collectors.toList()),
                "source", "rules"
        ));
    }

    private List<EventResponse> searchForChat(String message) {
        String q = message.toLowerCase();
        AdvancedSearchRequest req = new AdvancedSearchRequest();

        String normalized = q
                .replace("intersteller", "interstellar")
                .replace("interstelar", "interstellar")
                .replace("god father", "godfather")
                .replace("wankede", "wankhede");

        if (normalized.contains("near me") || normalized.contains("nearby")) {
            req.setLat(19.1197);
            req.setLng(72.8468);
            req.setRadiusKm(50.0);
            req.setSortBy("distance");
        }
        if (normalized.contains("movie") || normalized.contains("film") || normalized.contains("cinema")
                || normalized.contains("interstellar") || normalized.contains("dune") || normalized.contains("godfather")) {
            req.setCategory("MOVIE");
        }
        if (normalized.contains("concert") || normalized.contains("live") || normalized.contains("music")
                || normalized.contains("arijit") || normalized.contains("rahman")) {
            req.setCategory("CONCERT");
        }
        if (normalized.contains("sport") || normalized.contains("cricket") || normalized.contains("match")
                || normalized.contains("wankhede") || normalized.contains("ipl")) {
            req.setCategory("SPORTS");
        }
        if (normalized.contains("theater") || normalized.contains("theatre") || normalized.contains("hamlet")) {
            req.setCategory("THEATER");
        }
        if (normalized.contains("imax")) {
            req.setFormat("IMAX");
            req.setLat(19.1197);
            req.setLng(72.8468);
            req.setRadiusKm(50.0);
            req.setSortBy("distance");
        }

        String keyword = normalized
                .replaceAll("near me|nearby|around me|show me|find|search|please|events?|shows?", " ")
                .replaceAll("\\b(movies?|films?|cinema|concerts?|live|music|sports?|cricket|match|theater|theatre|plays?|imax)\\b", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (!keyword.isEmpty()) {
            req.setKeyword(keyword);
        }
        if (req.getKeyword() == null && req.getCategory() != null && req.getLat() == null) {
            req.setLat(19.1197);
            req.setLng(72.8468);
            req.setRadiusKm(50.0);
            req.setSortBy("distance");
        }

        try {
            return eventService.advancedSearch(req);
        } catch (Exception e) {
            log.warn("Chat search failed: {}", e.getMessage());
            return List.of();
        }
    }

    private String buildEventContext(List<EventResponse> events) {
        if (events == null || events.isEmpty()) {
            return "No matching events in inventory right now.";
        }
        StringBuilder sb = new StringBuilder("Matching events (use only these facts):\n");
        int i = 0;
        for (EventResponse e : events) {
            if (i++ >= 8) break;
            sb.append("- ").append(e.getTitle())
                    .append(" | ").append(e.getCategory())
                    .append(" | ").append(e.getVenueName()).append(", ").append(e.getCity());
            if (e.getDistanceKm() != null) sb.append(" | ").append(e.getDistanceKm()).append(" km");
            if (e.getMinPrice() != null) sb.append(" | from ₹").append(e.getMinPrice());
            sb.append(" | id=").append(e.getId()).append("\n");
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private String callGeminiApi(String userMessage, String eventContext) {
        String url = geminiApiUrl + "?key=" + geminiApiKey;
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String systemPrompt = """
                You are SyncBot, the CinemaSync ticketing assistant (India).
                Be concise, friendly, and helpful. Use INR (₹) when talking price.
                Only recommend events from the EVENT CONTEXT below. If none match, say so and suggest "movies near me" or IMAX.
                Explain booking briefly when asked: select showtime → seats (10 min lock) → pay → confirmation.
                Grey seats = locked by others or booked.
                Do not invent showtimes or prices.
                """ + "\n\nEVENT CONTEXT:\n" + eventContext;

        Map<String, Object> payload = new LinkedHashMap<>();
        Map<String, Object> contents = new LinkedHashMap<>();
        
        List<Map<String, String>> parts = new ArrayList<>();
        Map<String, String> part = new LinkedHashMap<>();
        part.put("text", "System: " + systemPrompt + "\n\nUser: " + userMessage);
        parts.add(part);
        
        contents.put("parts", parts);
        payload.put("contents", List.of(contents));
        
        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", 0.4);
        generationConfig.put("maxOutputTokens", 500);
        payload.put("generationConfig", generationConfig);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        ResponseEntity<Map> resp = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
        
        Map body = resp.getBody();
        if (body == null) {
            throw new RuntimeException("Empty Gemini response");
        }
        
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new RuntimeException("No candidates in Gemini response");
        }
        
        Map<String, Object> firstCandidate = candidates.get(0);
        Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
        List<Map<String, Object>> partsList = (List<Map<String, Object>>) content.get("parts");
        
        if (partsList == null || partsList.isEmpty()) {
            throw new RuntimeException("No parts in Gemini response");
        }
        
        return partsList.get(0).get("text").toString().trim();
    }

    private String fallbackReply(String message, List<EventResponse> events) {
        String q = message.toLowerCase();
        if (q.contains("how to book") || q.contains("book ticket")) {
            return "To book: open event → pick showtime → select seats (~10 min lock) → Review → Pay → Confirmation. Grey seats are locked/booked by others.";
        }
        if (events == null || events.isEmpty()) {
            return "I couldn't find matching events. Try \"movies near me\", \"IMAX\", or a title like Interstellar.";
        }
        StringBuilder sb = new StringBuilder("Found ").append(events.size()).append(" event(s). Top picks:\n");
        int i = 0;
        for (EventResponse e : events) {
            if (i++ >= 5) break;
            sb.append(i).append(". ").append(e.getTitle())
                    .append(" · ").append(e.getVenueName() != null ? e.getVenueName() : e.getCity());
            if (e.getDistanceKm() != null) sb.append(" · ").append(e.getDistanceKm()).append(" km");
            sb.append("\n");
        }
        return sb.toString().trim();
    }
}
