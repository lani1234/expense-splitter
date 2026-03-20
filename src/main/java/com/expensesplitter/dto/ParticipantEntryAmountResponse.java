package com.expensesplitter.dto;

import com.expensesplitter.entity.ParticipantEntryAmount;

import java.math.BigDecimal;
import java.util.UUID;

public record ParticipantEntryAmountResponse(
        UUID id,
        UUID instanceFieldValueId,
        UUID templateParticipantId,
        BigDecimal amount
) {
    public static ParticipantEntryAmountResponse from(ParticipantEntryAmount e) {
        return new ParticipantEntryAmountResponse(
                e.getId(),
                e.getInstanceFieldValue().getId(),
                e.getTemplateParticipant().getId(),
                e.getAmount()
        );
    }
}
