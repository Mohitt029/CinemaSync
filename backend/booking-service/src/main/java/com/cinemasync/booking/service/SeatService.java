package com.cinemasync.booking.service;

import com.cinemasync.booking.dto.request.SeatLockRequest;
import com.cinemasync.booking.dto.response.SeatAvailabilityResponse;
import com.cinemasync.booking.model.ShowSeat;
import com.cinemasync.booking.model.SeatLock;
import com.cinemasync.booking.repository.ShowSeatRepository;
import com.cinemasync.booking.repository.SeatLockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeatService {
    private final ShowSeatRepository showSeatRepository;
    private final SeatLockRepository seatLockRepository;

    public SeatAvailabilityResponse getSeatAvailability(String showId) {
        log.info("Fetching seat availability for show: {}", showId);
        
        List<ShowSeat> allSeats = showSeatRepository.findByShowId(showId);
        
        List<SeatAvailabilityResponse.SeatInfo> seatInfos = allSeats.stream()
            .map(seat -> SeatAvailabilityResponse.SeatInfo.builder()
                .seatId(seat.getSeatId())
                .rowName(seat.getRowName())
                .number(seat.getNumber())
                .category(seat.getCategory())
                .price(seat.getPrice())
                .status(seat.getStatus())
                .lockedBy(seat.getUserId())
                .build())
            .collect(Collectors.toList());
        
        long available = allSeats.stream().filter(s -> "AVAILABLE".equals(s.getStatus())).count();
        long locked = allSeats.stream().filter(s -> "LOCKED".equals(s.getStatus())).count();
        long booked = allSeats.stream().filter(s -> "BOOKED".equals(s.getStatus())).count();
        
        return SeatAvailabilityResponse.builder()
            .showId(showId)
            .totalSeats(allSeats.size())
            .availableSeats((int) available)
            .lockedSeats((int) locked)
            .bookedSeats((int) booked)
            .seats(seatInfos)
            .build();
    }

    @Transactional
    public SeatLock lockSeats(SeatLockRequest request, String userId) {
        log.info("Locking seats for user: {}, show: {}, seats: {}", userId, request.getShowId(), request.getSeatIds());
        
        // Check if all seats are available
        List<ShowSeat> seats = showSeatRepository.findByShowIdAndSeatIds(
            request.getShowId(), request.getSeatIds()
        );
        
        for (ShowSeat seat : seats) {
            if (!"AVAILABLE".equals(seat.getStatus())) {
                throw new RuntimeException("Seat " + seat.getSeatId() + " is not available");
            }
        }
        
        // Lock seats atomically using optimistic locking
        for (ShowSeat seat : seats) {
            seat.setStatus("LOCKED");
            seat.setUserId(userId);
            seat.setLockedAt(LocalDateTime.now());
            seat.setExpiresAt(LocalDateTime.now().plusMinutes(10));
            seat.setVersion(seat.getVersion() + 1);
            showSeatRepository.save(seat);
        }
        
        // Create seat lock record
        SeatLock seatLock = SeatLock.builder()
            .id(UUID.randomUUID().toString())
            .showId(request.getShowId())
            .userId(userId)
            .seatIds(request.getSeatIds())
            .lockedAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusMinutes(10))
            .status("ACTIVE")
            .build();
        
        return seatLockRepository.save(seatLock);
    }

    @Transactional
    public void releaseLock(String lockId, String userId) {
        SeatLock seatLock = seatLockRepository.findById(lockId)
            .orElseThrow(() -> new RuntimeException("Lock not found"));
        
        if (!seatLock.getUserId().equals(userId)) {
            throw new RuntimeException("User does not own this lock");
        }
        
        // Release seats
        List<ShowSeat> seats = showSeatRepository.findByShowIdAndSeatIds(
            seatLock.getShowId(), seatLock.getSeatIds()
        );
        
        for (ShowSeat seat : seats) {
            if ("LOCKED".equals(seat.getStatus()) && userId.equals(seat.getUserId())) {
                seat.setStatus("AVAILABLE");
                seat.setUserId(null);
                seat.setLockedAt(null);
                seat.setExpiresAt(null);
                seat.setVersion(seat.getVersion() + 1);
                showSeatRepository.save(seat);
            }
        }
        
        seatLock.setStatus("RELEASED");
        seatLockRepository.save(seatLock);
    }

    @Transactional
    public void expireLocks() {
        log.info("Expiring expired locks");
        
        List<SeatLock> expiredLocks = seatLockRepository.findByStatusAndExpiresAtBefore(
            "ACTIVE", LocalDateTime.now()
        );
        
        for (SeatLock lock : expiredLocks) {
            List<ShowSeat> seats = showSeatRepository.findByShowIdAndSeatIds(
                lock.getShowId(), lock.getSeatIds()
            );
            
            for (ShowSeat seat : seats) {
                if ("LOCKED".equals(seat.getStatus()) && lock.getUserId().equals(seat.getUserId())) {
                    seat.setStatus("AVAILABLE");
                    seat.setUserId(null);
                    seat.setLockedAt(null);
                    seat.setExpiresAt(null);
                    seat.setVersion(seat.getVersion() + 1);
                    showSeatRepository.save(seat);
                }
            }
            
            lock.setStatus("EXPIRED");
            seatLockRepository.save(lock);
        }
        
        log.info("Expired {} locks", expiredLocks.size());
    }
}