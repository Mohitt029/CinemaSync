package com.cinemasync.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.ArrayList;
import java.util.List;

public class SeatLockRequest {

    @NotBlank(message = "Show ID is required")
    private String showId;

    @NotEmpty(message = "At least one seat must be selected")
    private List<String> seatIds = new ArrayList<>();

    public SeatLockRequest() {
    }

    public SeatLockRequest(String showId, List<String> seatIds) {
        this.showId = showId;
        this.seatIds = seatIds != null ? seatIds : new ArrayList<>();
    }

    public String getShowId() {
        return showId;
    }

    public void setShowId(String showId) {
        this.showId = showId;
    }

    public List<String> getSeatIds() {
        return seatIds;
    }

    public void setSeatIds(List<String> seatIds) {
        this.seatIds = seatIds != null ? seatIds : new ArrayList<>();
    }
}