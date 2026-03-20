package com.expensesplitter.dto;

import com.expensesplitter.entity.SplitRuleAllocation;

import java.math.BigDecimal;
import java.util.UUID;

public record SplitRuleAllocationResponse(
        UUID id,
        UUID splitRuleId,
        UUID templateParticipantId,
        BigDecimal percent
) {
    public static SplitRuleAllocationResponse from(SplitRuleAllocation e) {
        return new SplitRuleAllocationResponse(
                e.getId(),
                e.getSplitRule().getId(),
                e.getTemplateParticipant().getId(),
                e.getPercent()
        );
    }
}
