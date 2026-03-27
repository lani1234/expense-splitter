package com.expensesplitter.dto;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record ParticipantTotalsResponse(
        boolean hasPayers,
        Map<UUID, BigDecimal> shares,
        Map<UUID, BigDecimal> paid,
        Map<UUID, BigDecimal> net
) {}
