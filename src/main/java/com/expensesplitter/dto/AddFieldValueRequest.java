package com.expensesplitter.dto;

import com.expensesplitter.enums.SplitMode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public class AddFieldValueRequest {
    private UUID templateFieldId;
    private BigDecimal amount;
    private String note;
    private LocalDate entryDate;
    private SplitMode splitMode;
    private UUID overrideSplitRuleId;
    private Map<UUID, BigDecimal> participantAmounts; // For FIELD_VALUE_FIXED_AMOUNTS

    // Getters and Setters
    public UUID getTemplateFieldId() {
        return templateFieldId;
    }

    public void setTemplateFieldId(UUID templateFieldId) {
        this.templateFieldId = templateFieldId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDate entryDate) {
        this.entryDate = entryDate;
    }

    public SplitMode getSplitMode() {
        return splitMode;
    }

    public void setSplitMode(SplitMode splitMode) {
        this.splitMode = splitMode;
    }

    public UUID getOverrideSplitRuleId() {
        return overrideSplitRuleId;
    }

    public void setOverrideSplitRuleId(UUID overrideSplitRuleId) {
        this.overrideSplitRuleId = overrideSplitRuleId;
    }

    public Map<UUID, BigDecimal> getParticipantAmounts() {
        return participantAmounts;
    }

    public void setParticipantAmounts(Map<UUID, BigDecimal> participantAmounts) {
        this.participantAmounts = participantAmounts;
    }
}