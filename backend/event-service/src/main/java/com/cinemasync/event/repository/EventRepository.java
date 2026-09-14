// backend/event-service/src/main/java/com/cinemasync/event/repository/EventRepository.java
package com.cinemasync.event.repository;

import com.cinemasync.event.model.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends MongoRepository<Event, String> {

    List<Event> findByStatus(String status);

    @Query("{ 'status': 'UPCOMING', 'showtimes.dateTime': { $gte: ?0 } }")
    List<Event> findUpcomingEvents(LocalDateTime now);

    @Query("{ $or: [ " +
           "{ 'title': { $regex: ?0, $options: 'i' } }, " +
           "{ 'description': { $regex: ?0, $options: 'i' } }, " +
           "{ 'genre': { $regex: ?0, $options: 'i' } }, " +
           "{ 'venueName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'city': { $regex: ?0, $options: 'i' } }, " +
           "{ 'state': { $regex: ?0, $options: 'i' } }, " +
           "{ 'address': { $regex: ?0, $options: 'i' } }, " +
           "{ 'category': { $regex: ?0, $options: 'i' } }, " +
           "{ 'language': { $regex: ?0, $options: 'i' } }, " +
           "{ 'tags': { $regex: ?0, $options: 'i' } } " +
           "] }")
    Page<Event> searchEvents(String keyword, Pageable pageable);

    List<Event> findByCategoryAndCity(String category, String city);

    List<Event> findByFeaturedTrue();

    @Query("{ 'showtimes.dateTime': { $gte: ?0, $lte: ?1 } }")
    List<Event> findEventsByDateRange(LocalDateTime start, LocalDateTime end);

    List<Event> findByVenueId(String venueId);

    List<Event> findByCityIgnoreCase(String city);
}