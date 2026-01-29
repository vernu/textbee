package com.vernu.sms.dtos;

import java.util.List;

public class SimInfoCollectionDTO {
    private long lastUpdated;
    private List<SimInfoDTO> sims;

    public SimInfoCollectionDTO() {
    }

    public long getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(long lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public List<SimInfoDTO> getSims() {
        return sims;
    }

    public void setSims(List<SimInfoDTO> sims) {
        this.sims = sims;
    }
}
