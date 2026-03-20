package com.expensesplitter.dto;

import com.expensesplitter.entity.SplitRule;

import java.util.UUID;

public record SplitRuleResponse(
        UUID id,
        UUID templateId,
        String name
) {
    public static SplitRuleResponse from(SplitRule e) {
        return new SplitRuleResponse(
                e.getId(),
                e.getTemplate().getId(),
                e.getName()
        );
    }
}
