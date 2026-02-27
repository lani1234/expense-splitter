package com.expensesplitter.service;

import com.expensesplitter.entity.*;
import com.expensesplitter.enums.InstanceStatus;
import com.expensesplitter.enums.SplitMode;
import com.expensesplitter.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class InstanceService {

    private final TemplateInstanceRepository instanceRepository;
    private final InstanceFieldValueRepository fieldValueRepository;
    private final TemplateService templateService;
    private final ParticipantEntryAmountRepository participantEntryAmountRepository;

    public InstanceService(TemplateInstanceRepository instanceRepository,
                           InstanceFieldValueRepository fieldValueRepository,
                           TemplateService templateService,
                           ParticipantEntryAmountRepository participantEntryAmountRepository) {
        this.instanceRepository = instanceRepository;
        this.fieldValueRepository = fieldValueRepository;
        this.templateService = templateService;
        this.participantEntryAmountRepository = participantEntryAmountRepository;
    }

    // Instance CRUD Operations
    public TemplateInstance createInstance(UUID templateId, String name) {
        Template template = templateService.getTemplateById(templateId);
        TemplateInstance instance = new TemplateInstance();
        instance.setTemplate(template);
        instance.setName(name);
        instance.setStatus(InstanceStatus.IN_PROGRESS);
        return instanceRepository.save(instance);
    }

    public TemplateInstance getInstanceById(UUID instanceId) {
        return instanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Instance not found with id: " + instanceId));
    }

    public List<TemplateInstance> getInstancesByTemplate(UUID templateId) {
        return instanceRepository.findByTemplateId(templateId);
    }

    public List<TemplateInstance> getInstancesByTemplateAndStatus(UUID templateId, InstanceStatus status) {
        return instanceRepository.findByTemplateIdAndStatus(templateId, status);
    }

    public List<TemplateInstance> getAllInstances() {
        return instanceRepository.findAll();
    }

    public TemplateInstance updateInstanceName(UUID instanceId, String name) {
        TemplateInstance instance = getInstanceById(instanceId);
        instance.setName(name);
        return instanceRepository.save(instance);
    }

    public TemplateInstance markInstanceAsSettled(UUID instanceId) {
        TemplateInstance instance = getInstanceById(instanceId);
        instance.setStatus(InstanceStatus.SETTLED);
        return instanceRepository.save(instance);
    }

    public TemplateInstance markInstanceAsInProgress(UUID instanceId) {
        TemplateInstance instance = getInstanceById(instanceId);
        instance.setStatus(InstanceStatus.IN_PROGRESS);
        return instanceRepository.save(instance);
    }

    public void deleteInstance(UUID instanceId) {
        instanceRepository.deleteById(instanceId);
    }

    // Field Value Operations
    public InstanceFieldValue addFieldValue(UUID instanceId, UUID templateFieldId, BigDecimal amount,
                                            String note, java.time.LocalDate entryDate,
                                            com.expensesplitter.enums.SplitMode splitMode,
                                            UUID overrideSplitRuleId) {
        TemplateInstance instance = getInstanceById(instanceId);
        TemplateField templateField = templateService.getFieldById(templateFieldId);

        InstanceFieldValue fieldValue = new InstanceFieldValue();
        fieldValue.setInstance(instance);
        fieldValue.setTemplateField(templateField);
        fieldValue.setAmount(amount);
        fieldValue.setNote(note);
        fieldValue.setEntryDate(entryDate);
        fieldValue.setSplitMode(splitMode != null ? splitMode : SplitMode.DEFAULT);

        if (overrideSplitRuleId != null) {
            SplitRule overrideRule = templateService.getSplitRuleById(overrideSplitRuleId);
            fieldValue.setOverrideSplitRule(overrideRule);
        }

        InstanceFieldValue savedInstanceFieldValue = fieldValueRepository.save(fieldValue);

        if(savedInstanceFieldValue.getSplitMode() != SplitMode.FIXED_AMOUNTS) {
            calculateAndCreateParticipantEntryAmounts(savedInstanceFieldValue);
        }

        return savedInstanceFieldValue;
    }

    public List<InstanceFieldValue> getFieldValuesByInstance(UUID instanceId) {
        return fieldValueRepository.findByInstanceId(instanceId);
    }

    public List<InstanceFieldValue> getFieldValuesByInstanceAndField(UUID instanceId, UUID templateFieldId) {
        return fieldValueRepository.findByInstanceIdAndTemplateFieldId(instanceId, templateFieldId);
    }

    public InstanceFieldValue getFieldValueById(UUID fieldValueId) {
        return fieldValueRepository.findById(fieldValueId)
                .orElseThrow(() -> new RuntimeException("Field value not found with id: " + fieldValueId));
    }

    public InstanceFieldValue updateFieldValue(UUID fieldValueId, BigDecimal amount, String note,
                                               java.time.LocalDate entryDate,
                                               com.expensesplitter.enums.SplitMode splitMode,
                                               UUID overrideSplitRuleId) {
        InstanceFieldValue fieldValue = getFieldValueById(fieldValueId);
        fieldValue.setAmount(amount);
        fieldValue.setNote(note);
        fieldValue.setEntryDate(entryDate);
        fieldValue.setSplitMode(splitMode);

        if (overrideSplitRuleId != null) {
            SplitRule overrideRule = templateService.getSplitRuleById(overrideSplitRuleId);
            fieldValue.setOverrideSplitRule(overrideRule);
        }

        return fieldValueRepository.save(fieldValue);
    }

    public void deleteFieldValue(UUID fieldValueId) {
        fieldValueRepository.deleteById(fieldValueId);
    }

    // Calculation & Auto-Allocation
    public void calculateAndCreateParticipantEntryAmounts(InstanceFieldValue fieldValue) {

        // Determine which split rule to use
        SplitRule splitRule = null;
        if (fieldValue.getOverrideSplitRule() != null) {
            splitRule = fieldValue.getOverrideSplitRule();
        } else {
            splitRule = fieldValue.getTemplateField().getDefaultSplitRule();
        }

        // If no split rule is defined, we can't allocate
        if (splitRule == null) {
            throw new RuntimeException("No split rule defined for field value: " + fieldValue.getId());
        }

        // Get all allocations (percentages) for this split rule
        List<SplitRuleAllocation> ruleAllocations = templateService.getAllocationsForRule(splitRule.getId());

        // Create a participant_entry_amount for each person in the split rule
        for (SplitRuleAllocation ruleAllocation : ruleAllocations) {
            BigDecimal participantAmount = fieldValue.getAmount()
                    .multiply(ruleAllocation.getPercent())
                    .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);

            ParticipantEntryAmount participantEntryAmount = new ParticipantEntryAmount();
            participantEntryAmount.setInstanceFieldValue(fieldValue);
            participantEntryAmount.setTemplateParticipant(ruleAllocation.getTemplateParticipant());
            participantEntryAmount.setAmount(participantAmount);
            participantEntryAmountRepository.save(participantEntryAmount);
        }
    }
}