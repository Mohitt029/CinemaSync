// backend/booking-service/src/main/java/com/cinemasync/booking/service/SeatAllocationService.java
package com.cinemasync.booking.service;

import com.cinemasync.booking.model.SeatMatrix;
import com.cinemasync.booking.model.SeatMatrix.Seat;
import com.cinemasync.booking.model.SeatMatrix.LockInfo;
import com.cinemasync.booking.repository.SeatMatrixRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeatAllocationService {
    private final SeatMatrixRepository seatMatrixRepository;
    private final ConcurrentHashMap<String, SeatMatrix> matrixCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> activeLocks = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> lockTimers = new ConcurrentHashMap<>();

    private static final int LOCK_DURATION_SECONDS = 600;

    @Transactional
    public SeatMatrix initializeSeatMatrix(String showId, int rows, int cols,
                                           Map<String, Double> categoryPrices,
                                           Map<String, String> categoryRows) {
        log.info("🚀 Initializing seat matrix for show: {}", showId);

        Optional<SeatMatrix> existing = seatMatrixRepository.findByShowId(showId);
        if (existing.isPresent()) {
            log.info("Seat matrix already exists for show: {}", showId);
            return existing.get();
        }

        SeatMatrix matrix = new SeatMatrix();
        matrix.setShowId(showId);
        matrix.setRows(rows);
        matrix.setCols(cols);
        matrix.setMatrix(new Seat[rows][cols]);
        matrix.setSeatMap(new ConcurrentHashMap<>());
        matrix.setCategorySeats(new ConcurrentHashMap<>());
        matrix.setSeatLocks(new ConcurrentHashMap<>());
        matrix.setLockTimers(new ConcurrentHashMap<>());
        matrix.setLastUpdated(System.currentTimeMillis());

        if (categoryRows == null || categoryRows.isEmpty()) {
            categoryRows = new HashMap<>();
            categoryRows.put("PLATINUM", "0-2");
            categoryRows.put("GOLD", "3-5");
            categoryRows.put("SILVER", "6-9");
        }

        if (categoryPrices == null || categoryPrices.isEmpty()) {
            categoryPrices = new HashMap<>();
            categoryPrices.put("SILVER", 250.0);
            categoryPrices.put("GOLD", 400.0);
            categoryPrices.put("PLATINUM", 600.0);
        }

        for (int row = 0; row < rows; row++) {
            String rowName = String.valueOf((char) ('A' + row));
            for (int col = 0; col < cols; col++) {
                String seatId = rowName + (col + 1);
                String category = determineCategory(row, categoryRows);
                double price = categoryPrices.getOrDefault(category, 100.0);

                Seat seat = Seat.builder()
                    .seatId(seatId)
                    .row(row)
                    .col(col)
                    .rowName(rowName)
                    .number(col + 1)
                    .category(category)
                    .price(price)
                    .status("AVAILABLE")
                    .userId(null)
                    .version(0)
                    .build();

                matrix.getMatrix()[row][col] = seat;
                matrix.getSeatMap().put(seatId, seat);
                matrix.getCategorySeats()
                    .computeIfAbsent(category, k -> new HashSet<>())
                    .add(seatId);
            }
        }

        matrix.setTotalSeats(rows * cols);
        matrix.setAvailableSeats(rows * cols);
        matrix.setLockedSeats(0);
        matrix.setBookedSeats(0);

        SeatMatrix saved = seatMatrixRepository.save(matrix);
        matrixCache.put(showId, saved);
        log.info("✅ Seat matrix initialized for show: {} with {} seats", showId, saved.getTotalSeats());
        return saved;
    }

    private String determineCategory(int row, Map<String, String> categoryRows) {
        if (categoryRows == null || categoryRows.isEmpty()) {
            if (row < 3) return "PLATINUM";
            else if (row < 6) return "GOLD";
            else return "SILVER";
        }
        for (Map.Entry<String, String> entry : categoryRows.entrySet()) {
            String[] rows = entry.getValue().split("-");
            int start = Integer.parseInt(rows[0]);
            int end = rows.length > 1 ? Integer.parseInt(rows[1]) : start;
            if (row >= start && row <= end) {
                return entry.getKey();
            }
        }
        return "SILVER";
    }

    public SeatMatrix getSeatMatrix(String showId) {
        if (matrixCache.containsKey(showId)) {
            return matrixCache.get(showId);
        }
        Optional<SeatMatrix> matrixOpt = seatMatrixRepository.findByShowId(showId);
        if (matrixOpt.isPresent()) {
            SeatMatrix matrix = matrixOpt.get();
            matrixCache.put(showId, matrix);
            return matrix;
        }
        log.warn("Seat matrix not found for show: {}", showId);
        throw new RuntimeException("Seat matrix not found for show: " + showId);
    }

    /**
     * Use this for ANY read of availability. Demotes expired locks back to
     * AVAILABLE immediately, instead of waiting for the 30s scheduled sweep —
     * closes the staleness window where an expired lock still reads as LOCKED.
     */
    @Transactional
    public synchronized SeatMatrix getSeatMatrixWithExpiryCheck(String showId) {
        SeatMatrix matrix = getSeatMatrix(showId);
        LocalDateTime now = LocalDateTime.now();
        List<String> expiredSeatIds = new ArrayList<>();

        for (Map.Entry<String, LockInfo> entry : matrix.getSeatLocks().entrySet()) {
            if (entry.getValue() != null && entry.getValue().getExpiresAt().isBefore(now)) {
                expiredSeatIds.add(entry.getKey());
            }
        }

        for (String seatId : expiredSeatIds) {
            matrix.getSeatLocks().remove(seatId);
            Seat seat = matrix.getSeatMap().get(seatId);
            if (seat != null && "LOCKED".equals(seat.getStatus())) {
                seat.setStatus("AVAILABLE");
                seat.setUserId(null);
                seat.setLockedAt(null);
                seat.setExpiresAt(null);
                seat.setVersion(seat.getVersion() + 1);
                matrix.setAvailableSeats(matrix.getAvailableSeats() + 1);
                matrix.setLockedSeats(matrix.getLockedSeats() - 1);
            }
            activeLocks.remove(seatId);
            lockTimers.remove(seatId);
        }

        if (!expiredSeatIds.isEmpty()) {
            matrix.setLastUpdated(System.currentTimeMillis());
            seatMatrixRepository.save(matrix);
            matrixCache.put(showId, matrix);
            log.info("🧹 Demoted {} expired lock(s) at read-time for show {}", expiredSeatIds.size(), showId);
        }

        return matrix;
    }

    @Transactional
    public synchronized Seat lockSeat(String showId, String seatId, String userId) {
        log.info("🔒 LOCKING seat: {} for user: {}", seatId, userId);

        SeatMatrix matrix = getSeatMatrix(showId);
        Seat seat = matrix.getSeatMap().get(seatId);

        if (seat == null) {
            throw new RuntimeException("Seat not found: " + seatId);
        }

        if (!"AVAILABLE".equals(seat.getStatus())) {
            String currentStatus = seat.getStatus();
            String message;
            if ("LOCKED".equals(currentStatus)) {
                LockInfo existingLock = matrix.getSeatLocks().get(seatId);
                if (existingLock != null && existingLock.getExpiresAt().isAfter(LocalDateTime.now())) {
                    message = "Seat " + seatId + " is currently locked by user: " + existingLock.getUserId();
                } else {
                    message = "Seat " + seatId + " lock has expired";
                }
            } else if ("BOOKED".equals(currentStatus)) {
                message = "Seat " + seatId + " is already booked";
            } else {
                message = "Seat " + seatId + " is not available (status: " + currentStatus + ")";
            }
            log.warn("❌ {}", message);
            throw new RuntimeException(message);
        }

        LockInfo existingLock = matrix.getSeatLocks().get(seatId);
        if (existingLock != null) {
            if (existingLock.getExpiresAt().isAfter(LocalDateTime.now())) {
                String message = "Seat " + seatId + " is already locked by user: " + existingLock.getUserId();
                log.warn("❌ {}", message);
                throw new RuntimeException(message);
            } else {
                matrix.getSeatLocks().remove(seatId);
                log.info("Removed expired lock for seat: {}", seatId);
            }
        }

        LockInfo newLock = LockInfo.builder()
            .userId(userId)
            .seatId(seatId)
            .lockedAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusSeconds(LOCK_DURATION_SECONDS))
            .lockId(UUID.randomUUID().toString())
            .build();

        matrix.getSeatLocks().put(seatId, newLock);

        seat.setStatus("LOCKED");
        seat.setUserId(userId);
        seat.setLockedAt(LocalDateTime.now());
        seat.setExpiresAt(LocalDateTime.now().plusSeconds(LOCK_DURATION_SECONDS));
        seat.setVersion(seat.getVersion() + 1);

        matrix.setAvailableSeats(matrix.getAvailableSeats() - 1);
        matrix.setLockedSeats(matrix.getLockedSeats() + 1);
        matrix.setLastUpdated(System.currentTimeMillis());

        lockTimers.put(seatId, System.currentTimeMillis() + (LOCK_DURATION_SECONDS * 1000));
        activeLocks.put(seatId, userId);

        seatMatrixRepository.save(matrix);
        matrixCache.put(showId, matrix);

        log.info("✅ Seat LOCKED: {} by user: {}, expires at: {}", seatId, userId, newLock.getExpiresAt());
        return seat;
    }

    @Transactional
    public synchronized List<Seat> lockSeatsBatch(String showId, List<String> seatIds, String userId) {
        log.info("🔒 Locking {} seats for user: {}", seatIds.size(), userId);

        List<Seat> lockedSeats = new ArrayList<>();
        List<String> lockedIds = new ArrayList<>();

        try {
            for (String seatId : seatIds) {
                Seat seat = lockSeat(showId, seatId, userId);
                lockedSeats.add(seat);
                lockedIds.add(seatId);
            }
            log.info("✅ Successfully locked {} seats for user: {}", lockedIds.size(), userId);
            return lockedSeats;
        } catch (Exception e) {
            log.error("❌ Failed to lock all seats, rolling back: {}", e.getMessage());
            for (String seatId : lockedIds) {
                try {
                    releaseLock(showId, seatId, userId);
                } catch (Exception ex) {
                    log.error("Error rolling back seat: {}", seatId, ex);
                }
            }
            throw new RuntimeException("Failed to lock all seats: " + e.getMessage());
        }
    }

    @Transactional
    public synchronized void releaseLock(String showId, String seatId, String userId) {
        log.info("🔓 RELEASING lock for seat: {} by user: {}", seatId, userId);

        SeatMatrix matrix = getSeatMatrix(showId);
        LockInfo lock = matrix.getSeatLocks().get(seatId);

        if (lock == null) {
            log.warn("No lock found for seat: {}", seatId);
            return;
        }

        if (!lock.getUserId().equals(userId)) {
            log.warn("User {} does not own lock for seat: {}", userId, seatId);
            throw new RuntimeException("User does not own this lock");
        }

        matrix.getSeatLocks().remove(seatId);
        activeLocks.remove(seatId);
        lockTimers.remove(seatId);

        Seat seat = matrix.getSeatMap().get(seatId);
        if (seat != null && "LOCKED".equals(seat.getStatus()) && userId.equals(seat.getUserId())) {
            seat.setStatus("AVAILABLE");
            seat.setUserId(null);
            seat.setLockedAt(null);
            seat.setExpiresAt(null);
            seat.setVersion(seat.getVersion() + 1);

            matrix.setAvailableSeats(matrix.getAvailableSeats() + 1);
            matrix.setLockedSeats(matrix.getLockedSeats() - 1);
            matrix.setLastUpdated(System.currentTimeMillis());

            seatMatrixRepository.save(matrix);
            matrixCache.put(showId, matrix);

            log.info("✅ Lock RELEASED for seat: {}", seatId);
        } else {
            log.warn("Seat {} was not in LOCKED state or owned by user {}", seatId, userId);
        }
    }

    @Transactional
    public synchronized Seat bookSeat(String showId, String seatId, String userId, String bookingId) {
        log.info("📕 BOOKING seat: {} for user: {}, booking: {}", seatId, userId, bookingId);

        SeatMatrix matrix = getSeatMatrix(showId);
        LockInfo lock = matrix.getSeatLocks().get(seatId);

        if (lock == null) {
            throw new RuntimeException("Lock not found for seat: " + seatId + ". Seat must be locked before booking.");
        }

        if (!lock.getUserId().equals(userId)) {
            throw new RuntimeException("User does not own this lock");
        }

        if (lock.getExpiresAt().isBefore(LocalDateTime.now())) {
            matrix.getSeatLocks().remove(seatId);
            throw new RuntimeException("Lock has expired for seat: " + seatId);
        }

        Seat seat = matrix.getSeatMap().get(seatId);
        seat.setStatus("BOOKED");
        seat.setUserId(userId);
        seat.setVersion(seat.getVersion() + 1);

        matrix.setLockedSeats(matrix.getLockedSeats() - 1);
        matrix.setBookedSeats(matrix.getBookedSeats() + 1);
        matrix.setLastUpdated(System.currentTimeMillis());

        matrix.getSeatLocks().remove(seatId);
        activeLocks.remove(seatId);
        lockTimers.remove(seatId);

        seatMatrixRepository.save(matrix);
        matrixCache.put(showId, matrix);

        log.info("✅ Seat BOOKED: {} for booking: {}", seatId, bookingId);
        return seat;
    }

    /**
     * NEW: the missing counterpart to bookSeat — reverses BOOKED back to
     * AVAILABLE in the SAME matrix everything else reads from. Needed for
     * cancellations, since the old cancelBooking only touched a separate
     * ShowSeat table that the availability endpoint never looks at.
     */
    @Transactional
    public synchronized void releaseBookedSeats(String showId, List<String> seatIds, String userId) {
        log.info("↩️ Releasing {} BOOKED seat(s) back to AVAILABLE for cancellation, user: {}", seatIds.size(), userId);

        SeatMatrix matrix = getSeatMatrix(showId);
        for (String seatId : seatIds) {
            Seat seat = matrix.getSeatMap().get(seatId);
            if (seat == null) continue;
            if (!"BOOKED".equals(seat.getStatus())) {
                log.warn("Seat {} was not BOOKED (status: {}), skipping", seatId, seat.getStatus());
                continue;
            }
            if (!userId.equals(seat.getUserId())) {
                log.warn("Seat {} is booked by a different user, refusing to release", seatId);
                continue;
            }
            seat.setStatus("AVAILABLE");
            seat.setUserId(null);
            seat.setVersion(seat.getVersion() + 1);
            matrix.setBookedSeats(matrix.getBookedSeats() - 1);
            matrix.setAvailableSeats(matrix.getAvailableSeats() + 1);
        }

        matrix.setLastUpdated(System.currentTimeMillis());
        seatMatrixRepository.save(matrix);
        matrixCache.put(showId, matrix);
        log.info("✅ Released {} seat(s) back to AVAILABLE", seatIds.size());
    }

    public List<Seat> findBestAvailableSeats(String showId, int seatCount, String preferredCategory) {
        SeatMatrix matrix = getSeatMatrix(showId);
        List<Seat> availableSeats = matrix.getSeatMap().values().stream()
            .filter(seat -> "AVAILABLE".equals(seat.getStatus()))
            .filter(seat -> preferredCategory == null || seat.getCategory().equals(preferredCategory))
            .sorted(Comparator.comparing(Seat::getRow).thenComparing(Seat::getCol))
            .collect(Collectors.toList());

        if (availableSeats.size() < seatCount) {
            return availableSeats;
        }

        for (int i = 0; i <= availableSeats.size() - seatCount; i++) {
            List<Seat> candidate = new ArrayList<>();
            Seat first = availableSeats.get(i);
            candidate.add(first);

            for (int j = 1; j < seatCount; j++) {
                Seat next = availableSeats.get(i + j);
                if (next.getRow() == first.getRow() &&
                    next.getCol() == first.getCol() + j) {
                    candidate.add(next);
                } else {
                    break;
                }
            }

            if (candidate.size() == seatCount) {
                return candidate;
            }
        }

        return availableSeats.subList(0, Math.min(seatCount, availableSeats.size()));
    }

    @Scheduled(fixedDelay = 30000)
    public void cleanExpiredLocks() {
        log.debug("🧹 Running expired lock cleanup...");
        int releasedCount = 0;

        for (String showId : matrixCache.keySet()) {
            SeatMatrix matrix = matrixCache.get(showId);
            if (matrix == null) continue;

            List<String> expiredSeats = new ArrayList<>();

            for (Map.Entry<String, LockInfo> entry : matrix.getSeatLocks().entrySet()) {
                String seatId = entry.getKey();
                LockInfo lock = entry.getValue();
                if (lock != null && lock.getExpiresAt().isBefore(LocalDateTime.now())) {
                    expiredSeats.add(seatId);
                }
            }

            for (String seatId : expiredSeats) {
                try {
                    LockInfo lock = matrix.getSeatLocks().get(seatId);
                    if (lock != null) {
                        releaseLock(showId, seatId, lock.getUserId());
                        releasedCount++;
                        log.info("🔓 Released expired lock for seat: {} (user: {})", seatId, lock.getUserId());
                    }
                } catch (Exception e) {
                    log.error("Error releasing expired lock for seat: {}", seatId, e);
                    matrix.getSeatLocks().remove(seatId);
                    Seat seat = matrix.getSeatMap().get(seatId);
                    if (seat != null) {
                        seat.setStatus("AVAILABLE");
                        seat.setUserId(null);
                        seat.setLockedAt(null);
                        seat.setExpiresAt(null);
                    }
                }
            }
        }

        if (releasedCount > 0) {
            log.info("🧹 Released {} expired locks", releasedCount);
        }
    }

    /**
     * Smart release: for each seat, decide whether it is LOCKED or BOOKED
     * and call the right release path. Used by booking cancellation.
     */
    @Transactional
    public synchronized void releaseSeatsForBooking(String showId, List<String> seatIds, String userId) {
        log.info("↩️ Smart-releasing {} seat(s) for user: {}", seatIds.size(), userId);
        SeatMatrix matrix = getSeatMatrix(showId);

        for (String seatId : seatIds) {
            Seat seat = matrix.getSeatMap().get(seatId);
            if (seat == null) continue;

            String status = seat.getStatus();
            if ("BOOKED".equals(status)) {
                if (userId.equals(seat.getUserId())) {
                    seat.setStatus("AVAILABLE");
                    seat.setUserId(null);
                    seat.setVersion(seat.getVersion() + 1);
                    matrix.setBookedSeats(matrix.getBookedSeats() - 1);
                    matrix.setAvailableSeats(matrix.getAvailableSeats() + 1);
                    log.info("  Released BOOKED seat: {}", seatId);
                } else {
                    log.warn("  Refusing to release BOOKED seat {}: owned by another user", seatId);
                }
            } else if ("LOCKED".equals(status)) {
                LockInfo lock = matrix.getSeatLocks().get(seatId);
                if (lock != null && userId.equals(lock.getUserId())) {
                    matrix.getSeatLocks().remove(seatId);
                    activeLocks.remove(seatId);
                    lockTimers.remove(seatId);
                    seat.setStatus("AVAILABLE");
                    seat.setUserId(null);
                    seat.setLockedAt(null);
                    seat.setExpiresAt(null);
                    seat.setVersion(seat.getVersion() + 1);
                    matrix.setLockedSeats(matrix.getLockedSeats() - 1);
                    matrix.setAvailableSeats(matrix.getAvailableSeats() + 1);
                    log.info("  Released LOCKED seat: {}", seatId);
                }
            }
        }

        matrix.setLastUpdated(System.currentTimeMillis());
        seatMatrixRepository.save(matrix);
        matrixCache.put(showId, matrix);
        log.info("✅ Smart release complete for {} seat(s)", seatIds.size());
    }
}