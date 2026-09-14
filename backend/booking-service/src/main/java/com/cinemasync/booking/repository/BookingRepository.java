package com.cinemasync.booking.repository;

import com.cinemasync.booking.model.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByUserId(String userId);

    List<Booking> findByUserIdAndStatus(String userId, String status);

    List<Booking> findByShowId(String showId);

    List<Booking> findByStatusAndCreatedAtBefore(String status, LocalDateTime date);

    boolean existsByBookingReference(String bookingReference);

    List<Booking> findByStatusAndHoldExpiresAtBefore(String status, LocalDateTime date);

    /** Admin pagination */
    Page<Booking> findByStatus(String status, Pageable pageable);
}