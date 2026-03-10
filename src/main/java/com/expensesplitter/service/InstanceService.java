package com.expensesplitter.service;

import com.expensesplitter.dto.AddFieldValueRequest;
import com.expensesplitter.entity.*;
import com.expensesplitter.enums.InstanceStatus;
import com.expensesplitter.enums.SplitMode;
import com.expensesplitter.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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
        if (templateId == null) {
            throw new ValidationException("Template ID is required");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Instance name is required");
        }
        if (name.length() > 255) {
            throw new ValidationException("Instance name cannot exceed 255 characters");
        }

        Template template = templateService.getTemplateById(templateId);
        TemplateInstance instance = new TemplateInstance();
        instance.setTemplate(template);
        instance.setName(name);
        instance.setStatus(InstanceStatus.IN_PROGRESS);
        TemplateInstance savedInstance = instanceRepository.save(instance);

        // Auto-populate fields with default amounts
        createDefaultFieldValues(savedInstance.getId());

        return savedInstance;
    }

    public TemplateInstance getInstanceById(UUID instanceId) {
        return instanceRepository.findById(instanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Instance not found with id: " + instanceId));
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
        if (instanceId == null) {
            throw new ValidationException("Instance ID is required");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Instance name is required");
        }
        if (name.length() > 255) {
            throw new ValidationException("Instance name cannot exceed 255 characters");
        }

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
    public InstanceFieldValue addFieldValue(UUID instanceId, AddFieldValueRequest request) {
        if (instanceId == null) {
            throw new ValidationException("Instance ID is required");
        }
        if (request.getTemplateFieldId() == null) {
            throw new ValidationException("Template field ID is required");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Amount must be greater than zero");
        }
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Amount must be greater than zero");
        }

        TemplateInstance instance = getInstanceById(instanceId);
        TemplateField templateField = templateService.getFieldById(request.getTemplateFieldId());

        InstanceFieldValue fieldValue = new InstanceFieldValue();
        fieldValue.setInstance(instance);
        fieldValue.setTemplateField(templateField);
        fieldValue.setAmount(request.getAmount());
        fieldValue.setNote(request.getNote());
        fieldValue.setEntryDate(request.getEntryDate() != null ? request.getEntryDate() : LocalDate.now());
        fieldValue.setSplitMode(request.getSplitMode() != null ? request.getSplitMode() : SplitMode.TEMPLATE_FIELD_PERCENT_SPLIT);

        if (request.getOverrideSplitRuleId() != null) {
            SplitRule overrideRule = templateService.getSplitRuleById(request.getOverrideSplitRuleId());
            fieldValue.setOverrideSplitRule(overrideRule);
        }

        InstanceFieldValue savedInstanceFieldValue = fieldValueRepository.save(fieldValue);

        // Handle different split modes
        if (fieldValue.getSplitMode() == SplitMode.FIELD_VALUE_FIXED_AMOUNTS) {
            // For fixed amounts, create ParticipantEntryAmount records directly
            createFixedAmountAllocations(savedInstanceFieldValue, request.getParticipantAmounts());
        } else {
            // For percentage-based splits, calculate allocations
            calculateAndCreateParticipantEntryAmounts(savedInstanceFieldValue);
        }

        return savedInstanceFieldValue;
    }

    private void createFixedAmountAllocations(InstanceFieldValue fieldValue, Map<UUID, BigDecimal> participantAmounts) {
        if (participantAmounts == null || participantAmounts.isEmpty()) {
            throw new ValidationException("Participant amounts are required for FIELD_VALUE_FIXED_AMOUNTS mode");
        }

        // Validate that amounts sum to the field value amount
        BigDecimal totalAmount = participantAmounts.values()
                .stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalAmount.compareTo(fieldValue.getAmount()) != 0) {
            throw new ValidationException("Participant amounts must sum to the total amount");
        }

        // Create ParticipantEntryAmount for each participant
        for (Map.Entry<UUID, BigDecimal> entry : participantAmounts.entrySet()) {
            UUID participantId = entry.getKey();
            BigDecimal amount = entry.getValue();

            TemplateParticipant participant = templateService.getParticipantById(participantId);

            ParticipantEntryAmount participantAmount = new ParticipantEntryAmount();
            participantAmount.setInstanceFieldValue(fieldValue);
            participantAmount.setTemplateParticipant(participant);
            participantAmount.setAmount(amount);

            participantEntryAmountRepository.save(participantAmount);
        }
    }

    public List<InstanceFieldValue> getFieldValuesByInstance(UUID instanceId) {
        return fieldValueRepository.findByInstanceId(instanceId);
    }

    public List<InstanceFieldValue> getFieldValuesByInstanceAndField(UUID instanceId, UUID templateFieldId) {
        return fieldValueRepository.findByInstanceIdAndTemplateFieldId(instanceId, templateFieldId);
    }

    public InstanceFieldValue getFieldValueById(UUID fieldValueId) {
        return fieldValueRepository.findById(fieldValueId)
                .orElseThrow(() -> new ResourceNotFoundException("Field value not found with id: " + fieldValueId));
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
        if (fieldValueId == null) {
            throw new ValidationException("Field value ID is required");
        }

        InstanceFieldValue fieldValue = getFieldValueById(fieldValueId);

        // Delete all ParticipantEntryAmount records for this field value first
        participantEntryAmountRepository.deleteByInstanceFieldValueId(fieldValueId);

        // Then delete the field value
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
            throw new ResourceNotFoundException("No split rule defined for field value: " + fieldValue.getId());
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

    // automatically create fieldvalue when default amounts are present on newly created fields
    public void createDefaultFieldValues(UUID instanceId) {
        TemplateInstance instance = getInstanceById(instanceId);
        List<TemplateField> fields = templateService.getFieldsByTemplate(instance.getTemplate().getId());

        for (TemplateField field : fields) {
            if (field.getDefaultAmount() != null) {
                InstanceFieldValue fieldValue = new InstanceFieldValue();
                fieldValue.setInstance(instance);
                fieldValue.setTemplateField(field);
                fieldValue.setAmount(field.getDefaultAmount());
                fieldValue.setSplitMode(SplitMode.TEMPLATE_FIELD_PERCENT_SPLIT);

                InstanceFieldValue savedFieldValue = fieldValueRepository.save(fieldValue);

                // Calculate allocations for the default field value
                calculateAndCreateParticipantEntryAmounts(savedFieldValue);
            }
        }
    }

}