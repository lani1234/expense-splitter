package com.expensesplitter.service;

import com.expensesplitter.entity.*;
import com.expensesplitter.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public TemplateService(TemplateRepository templateRepository,
                           TemplateParticipantRepository participantRepository,
                           SplitRuleRepository splitRuleRepository,
                           SplitRuleAllocationRepository splitRuleAllocationRepository,
                           TemplateFieldRepository fieldRepository) {
        this.templateRepository = templateRepository;
        this.participantRepository = participantRepository;
        this.splitRuleRepository = splitRuleRepository;
        this.splitRuleAllocationRepository = splitRuleAllocationRepository;
        this.fieldRepository = fieldRepository;
    }

    // Template CRUD Operations
    public Template createTemplate(UUID userId, String name, String description) {
        Template template = new Template();
        template.setUserId(userId);
        template.setName(name);
        template.setDescription(description);
        return templateRepository.save(template);
    }

    public Template getTemplateById(UUID templateId) {
        return templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + templateId));
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
        templateRepository.deleteById(templateId);
    }

    // Participant Operations
    public TemplateParticipant addParticipant(UUID templateId, String name, int displayOrder) {
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
        return participantRepository.findById(participantId)
                .orElseThrow(() -> new RuntimeException("Participant not found with id: " + participantId));
    }

    public void deleteParticipant(UUID participantId) {
        participantRepository.deleteById(participantId);
    }

    // Split Rule Operations
    public SplitRule createSplitRule(UUID templateId, String name) {
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
                .orElseThrow(() -> new RuntimeException("Split rule not found with id: " + splitRuleId));
    }

    public void deleteSplitRule(UUID splitRuleId) {
        splitRuleRepository.deleteById(splitRuleId);
    }

    // Split Rule Allocation Operations
    public SplitRuleAllocation addAllocationToRule(UUID splitRuleId, UUID participantId, java.math.BigDecimal percent) {
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
                                  UUID defaultSplitRuleId, int displayOrder) {
        Template template = getTemplateById(templateId);
        TemplateField field = new TemplateField();
        field.setTemplate(template);
        field.setLabel(label);
        field.setFieldType(fieldType);
        field.setDisplayOrder(displayOrder);

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
                .orElseThrow(() -> new RuntimeException("Field not found with id: " + fieldId));
    }

    public void deleteField(UUID fieldId) {
        fieldRepository.deleteById(fieldId);
    }
}