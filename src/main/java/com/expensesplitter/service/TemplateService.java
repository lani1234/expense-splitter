package com.expensesplitter.service;

import com.expensesplitter.entity.*;
import com.expensesplitter.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TemplateService {

    private final TemplateRepository templateRepository;
    private final TemplateParticipantRepository participantRepository;
    private final SplitRuleRepository splitRuleRepository;
    private final SplitRuleAllocationRepository splitRuleAllocationRepository;
    private final TemplateFieldRepository fieldRepository;
    private final TemplateInstanceRepository instanceRepository;
    private final InstanceFieldValueRepository fieldValueRepository;
    private final ParticipantEntryAmountRepository participantEntryAmountRepository;

    public TemplateService(TemplateRepository templateRepository,
                           TemplateParticipantRepository participantRepository,
                           SplitRuleRepository splitRuleRepository,
                           SplitRuleAllocationRepository splitRuleAllocationRepository,
                           TemplateFieldRepository fieldRepository,
                           TemplateInstanceRepository instanceRepository,
                           InstanceFieldValueRepository fieldValueRepository,
                           ParticipantEntryAmountRepository participantEntryAmountRepository) {
        this.templateRepository = templateRepository;
        this.participantRepository = participantRepository;
        this.splitRuleRepository = splitRuleRepository;
        this.splitRuleAllocationRepository = splitRuleAllocationRepository;
        this.fieldRepository = fieldRepository;
        this.instanceRepository = instanceRepository;
        this.fieldValueRepository = fieldValueRepository;
        this.participantEntryAmountRepository = participantEntryAmountRepository;
    }

    // Template CRUD Operations
    public Template createTemplate(UUID userId, String name, String description) {
        if (userId == null) {
            throw new ValidationException("User ID is required");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Template name is required");
        }
        if (name.length() > 255) {
            throw new ValidationException("Template name cannot exceed 255 characters");
        }

        Template template = new Template();
        template.setUserId(userId);
        template.setName(name);
        template.setDescription(description);
        return templateRepository.save(template);
    }

    public Template getTemplateById(UUID templateId) {
        return templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found with id: " + templateId));
    }

    public List<Template> getTemplatesByUserId(UUID userId) {
        return templateRepository.findByUserId(userId);
    }

    public List<Template> getAllTemplates() {
        return templateRepository.findAll();
    }

    public Template updateTemplate(UUID templateId, String name, String description) {
        Template template = getTemplateById(templateId);
        template.setName(name);
        template.setDescription(description);
        return templateRepository.save(template);
    }

    public void deleteTemplate(UUID templateId) {
        // Delete instances and their field values/participant amounts
        instanceRepository.findByTemplateId(templateId).forEach(instance -> {
            fieldValueRepository.findByInstanceIdOrderByCreatedAtAsc(instance.getId()).forEach(fv -> {
                participantEntryAmountRepository.deleteByInstanceFieldValueId(fv.getId());
            });
            fieldValueRepository.deleteAll(fieldValueRepository.findByInstanceIdOrderByCreatedAtAsc(instance.getId()));
        });
        instanceRepository.deleteAll(instanceRepository.findByTemplateId(templateId));

        // Delete split rule allocations, fields, split rules, participants
        splitRuleRepository.findByTemplateId(templateId).forEach(rule ->
            splitRuleAllocationRepository.deleteAll(splitRuleAllocationRepository.findBySplitRuleId(rule.getId()))
        );
        fieldRepository.deleteAll(fieldRepository.findByTemplateIdOrderByDisplayOrder(templateId));
        splitRuleRepository.deleteAll(splitRuleRepository.findByTemplateId(templateId));
        participantRepository.deleteAll(participantRepository.findByTemplateIdOrderByDisplayOrder(templateId));

        templateRepository.deleteById(templateId);
    }

    // Participant Operations
    public TemplateParticipant addParticipant(UUID templateId, String name, int displayOrder) {
        if (templateId == null) {
            throw new ValidationException("Template ID is required");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Participant name is required");
        }
        if (name.length() > 100) {
            throw new ValidationException("Participant name cannot exceed 100 characters");
        }

        Template template = getTemplateById(templateId);
        TemplateParticipant participant = new TemplateParticipant();
        participant.setTemplate(template);
        participant.setName(name);
        participant.setDisplayOrder(displayOrder);
        return participantRepository.save(participant);
    }

    public List<TemplateParticipant> getParticipantsByTemplate(UUID templateId) {
        return participantRepository.findByTemplateIdOrderByDisplayOrder(templateId);
    }

    public TemplateParticipant getParticipantById(UUID participantId) {
        if (participantId == null) {
            throw new ValidationException("Participant ID is required");
        }
        return participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found with id: " + participantId));
    }

    public TemplateParticipant renameParticipant(UUID participantId, String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Participant name is required");
        }
        if (name.length() > 100) {
            throw new ValidationException("Participant name cannot exceed 100 characters");
        }
        TemplateParticipant participant = getParticipantById(participantId);
        participant.setName(name.trim());
        return participantRepository.save(participant);
    }

    public void deleteParticipant(UUID participantId) {
        participantRepository.deleteById(participantId);
    }

    // Split Rule Operations
    public SplitRule createSplitRule(UUID templateId, String name) {
        if (templateId == null) {
            throw new ValidationException("Template ID is required");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Split rule name is required");
        }
        if (name.length() > 100) {
            throw new ValidationException("Split rule name cannot exceed 100 characters");
        }

        Template template = getTemplateById(templateId);
        SplitRule splitRule = new SplitRule();
        splitRule.setTemplate(template);
        splitRule.setName(name);
        return splitRuleRepository.save(splitRule);
    }

    public List<SplitRule> getSplitRulesByTemplate(UUID templateId) {
        return splitRuleRepository.findByTemplateId(templateId);
    }

    public SplitRule getSplitRuleById(UUID splitRuleId) {
        return splitRuleRepository.findById(splitRuleId)
                .orElseThrow(() -> new ResourceNotFoundException("Split rule not found with id: " + splitRuleId));
    }

    public void deleteSplitRule(UUID splitRuleId) {
        splitRuleRepository.deleteById(splitRuleId);
    }

    // Split Rule Allocation Operations
    public SplitRuleAllocation addAllocationToRule(UUID splitRuleId, UUID participantId, java.math.BigDecimal percent) {
        if (splitRuleId == null) {
            throw new ValidationException("Split rule ID is required");
        }
        if (participantId == null) {
            throw new ValidationException("Participant ID is required");
        }
        if (percent == null) {
            throw new ValidationException("Percent is required");
        }
        if (percent.compareTo(java.math.BigDecimal.ZERO) < 0 || percent.compareTo(new java.math.BigDecimal("100")) > 0) {
            throw new ValidationException("Percent must be between 0 and 100");
        }

        SplitRule splitRule = getSplitRuleById(splitRuleId);
        TemplateParticipant participant = getParticipantById(participantId);

        SplitRuleAllocation allocation = new SplitRuleAllocation();
        allocation.setSplitRule(splitRule);
        allocation.setTemplateParticipant(participant);
        allocation.setPercent(percent);
        return splitRuleAllocationRepository.save(allocation);
    }

    public List<SplitRuleAllocation> getAllocationsForRule(UUID splitRuleId) {
        return splitRuleAllocationRepository.findBySplitRuleId(splitRuleId);
    }

    public void deleteAllocation(UUID allocationId) {
        splitRuleAllocationRepository.deleteById(allocationId);
    }

    // Template Field Operations
    public TemplateField addField(UUID templateId, String label, com.expensesplitter.enums.FieldType fieldType,
                                  UUID defaultSplitRuleId, int displayOrder, BigDecimal defaultAmount) {
        if (templateId == null) {
            throw new ValidationException("Template ID is required");
        }
        if (label == null || label.trim().isEmpty()) {
            throw new ValidationException("Field label is required");
        }
        if (label.length() > 255) {
            throw new ValidationException("Field label cannot exceed 255 characters");
        }
        if (fieldType == null) {
            throw new ValidationException("Field type is required");
        }
        if (defaultAmount != null && defaultAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Default amount cannot be negative");
        }

        Template template = getTemplateById(templateId);
        TemplateField field = new TemplateField();
        field.setTemplate(template);
        field.setLabel(label);
        field.setFieldType(fieldType);
        field.setDisplayOrder(displayOrder);
        field.setDefaultAmount(defaultAmount);

        if (defaultSplitRuleId != null) {
            SplitRule defaultRule = getSplitRuleById(defaultSplitRuleId);
            field.setDefaultSplitRule(defaultRule);
        }

        return fieldRepository.save(field);
    }

    public List<TemplateField> getFieldsByTemplate(UUID templateId) {
        return fieldRepository.findByTemplateIdOrderByDisplayOrder(templateId);
    }

    public TemplateField getFieldById(UUID fieldId) {
        return fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Field not found with id: " + fieldId));
    }

    public TemplateField renameField(UUID fieldId, String label) {
        if (label == null || label.trim().isEmpty()) {
            throw new ValidationException("Field label is required");
        }
        if (label.length() > 255) {
            throw new ValidationException("Field label cannot exceed 255 characters");
        }
        TemplateField field = getFieldById(fieldId);
        field.setLabel(label.trim());
        return fieldRepository.save(field);
    }

    public void deleteField(UUID fieldId) {
        fieldRepository.deleteById(fieldId);
    }
}