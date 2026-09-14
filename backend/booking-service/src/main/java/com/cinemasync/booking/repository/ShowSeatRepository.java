package com.cinemasync.booking.repository;

import com.cinemasync.booking.model.ShowSeat;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShowSeatRepository extends MongoRepository<ShowSeat, String> {
    List<ShowSeat> findByShowId(String showId);
    
    @Query("{ 'showId': ?0, 'seatId': { $in: ?1 } }")
    List<ShowSeat> findByShowIdAndSeatIds(String showId, List<String> seatIds);
    
    @Query("{ 'showId': ?0, 'status': 'AVAILABLE' }")
    List<ShowSeat> findAvailableSeats(String showId);
    
    @Query("{ 'showId': ?0, 'status': { $in: ['LOCKED', 'BOOKED'] } }")
    List<ShowSeat> findUnavailableSeats(String showId);
}