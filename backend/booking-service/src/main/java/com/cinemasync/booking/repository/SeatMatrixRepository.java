package com.cinemasync.booking.repository;

import com.cinemasync.booking.model.SeatMatrix;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SeatMatrixRepository extends MongoRepository<SeatMatrix, String> {
    Optional<SeatMatrix> findByShowId(String showId);
    void deleteByShowId(String showId);
}