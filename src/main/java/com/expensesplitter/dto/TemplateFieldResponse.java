package com.expensesplitter.dto;

import com.expensesplitter.entity.TemplateField;
import com.expensesplitter.enums.FieldType;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record TemplateFieldResponse(
        UUID id,
        UUID templateId,
        String label,
        FieldType fieldType,
        UUID defaultSplitRuleId,
        BigDecimal defaultAmount,
        UUID defaultPayerParticipantId,
        int displayOrder,
        Map<UUID, BigDecimal> defaultParticipantAmounts
) {
    public static TemplateFieldResponse from(TemplateField e) {
        return from(e, null);
    }

    public static TemplateFieldResponse from(TemplateField e, Map<UUID, BigDecimal> defaultParticipantAmounts) {
        return new TemplateFieldResponse(
                e.getId(),
                e.getTemplate().getId(),
                e.getLabel(),
                e.getFieldType(),
                e.getDefaultSplitRule() != null ? e.getDefaultSplitRule().getId() : null,
                e.getDefaultAmount(),
                e.getDefaultPayerParticipant() != null ? e.getDefaultPayerParticipant().getId() : null,
                e.getDisplayOrder(),
                defaultParticipantAmounts
        );
    }
}
