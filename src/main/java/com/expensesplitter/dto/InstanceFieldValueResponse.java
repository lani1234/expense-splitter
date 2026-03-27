package com.expensesplitter.dto;

import com.expensesplitter.entity.InstanceFieldValue;
import com.expensesplitter.enums.SplitMode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record InstanceFieldValueResponse(
        UUID id,
        UUID instanceId,
        UUID templateFieldId,
        BigDecimal amount,
        String note,
        LocalDate entryDate,
        SplitMode splitMode,
        UUID overrideSplitRuleId,
        UUID payerParticipantId
) {
    public static InstanceFieldValueResponse from(InstanceFieldValue e) {
        return new InstanceFieldValueResponse(
                e.getId(),
                e.getInstance().getId(),
                e.getTemplateField().getId(),
                e.getAmount(),
                e.getNote(),
                e.getEntryDate(),
                e.getSplitMode(),
                e.getOverrideSplitRule() != null ? e.getOverrideSplitRule().getId() : null,
                e.getPayerParticipant() != null ? e.getPayerParticipant().getId() : null
        );
    }
}
