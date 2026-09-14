package com.cinemasync.event.repository;

import com.cinemasync.event.model.Venue;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VenueRepository extends MongoRepository<Venue, String> {
    
    List<Venue> findByCity(String city);
    
    List<Venue> findByStatus(String status);
    
    @Query("{ 'name': { $regex: ?0, $options: 'i' } }")
    List<Venue> searchVenues(String name);
}