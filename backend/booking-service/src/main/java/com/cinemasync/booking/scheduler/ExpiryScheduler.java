package com.cinemasync.booking.scheduler;

import com.cinemasync.booking.service.SeatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExpiryScheduler {
    private final SeatService seatService;

    @Scheduled(fixedDelay = 60000) // Run every minute
    public void expireLocks() {
        log.debug("Running lock expiry job");
        seatService.expireLocks();
    }
}