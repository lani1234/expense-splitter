package com.expensesplitter.dto;

import com.expensesplitter.entity.TemplateParticipant;

import java.util.UUID;

public record TemplateParticipantResponse(
        UUID id,
        UUID templateId,
        String name,
        int displayOrder
) {
    public static TemplateParticipantResponse from(TemplateParticipant e) {
        return new TemplateParticipantResponse(
                e.getId(),
                e.getTemplate().getId(),
                e.getName(),
                e.getDisplayOrder()
        );
    }
}
