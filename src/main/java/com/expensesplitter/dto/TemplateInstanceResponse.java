package com.expensesplitter.dto;

import com.expensesplitter.entity.TemplateInstance;
import com.expensesplitter.enums.InstanceStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record TemplateInstanceResponse(
        UUID id,
        UUID templateId,
        String name,
        InstanceStatus status,
        LocalDateTime createdAt
) {
    public static TemplateInstanceResponse from(TemplateInstance e) {
        return new TemplateInstanceResponse(
                e.getId(),
                e.getTemplate().getId(),
                e.getName(),
                e.getStatus(),
                e.getCreatedAt()
        );
    }
}
