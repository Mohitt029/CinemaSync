package com.cinemasync.booking.repository;

import com.cinemasync.booking.model.SeatLock;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SeatLockRepository extends MongoRepository<SeatLock, String> {
    List<SeatLock> findByShowIdAndStatus(String showId, String status);
    List<SeatLock> findByUserIdAndStatus(String userId, String status);
    List<SeatLock> findByStatusAndExpiresAtBefore(String status, LocalDateTime date);
}