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
public class AllocationService {

    private final ParticipantEntryAmountRepository allocationRepository;
    private final InstanceService instanceService;
    private final TemplateService templateService;

    public AllocationService(ParticipantEntryAmountRepository allocationRepository,
                             InstanceService instanceService,
                             TemplateService templateService) {
        this.allocationRepository = allocationRepository;
        this.instanceService = instanceService;
        this.templateService = templateService;
    }

    // Allocation CRUD Operations
    public ParticipantEntryAmount createAllocation(UUID fieldValueId, UUID participantId, BigDecimal amount) {
        InstanceFieldValue fieldValue = instanceService.getFieldValueById(fieldValueId);
        TemplateParticipant participant = templateService.getParticipantById(participantId);

        ParticipantEntryAmount allocation = new ParticipantEntryAmount();
        allocation.setInstanceFieldValue(fieldValue);
        allocation.setTemplateParticipant(participant);
        allocation.setAmount(amount);
        return allocationRepository.save(allocation);
    }

    public ParticipantEntryAmount getAllocationById(UUID allocationId) {
        return allocationRepository.findById(allocationId)
                .orElseThrow(() -> new RuntimeException("Allocation not found with id: " + allocationId));
    }

    public List<ParticipantEntryAmount> getAllocationsByFieldValue(UUID fieldValueId) {
        return allocationRepository.findByInstanceFieldValueId(fieldValueId);
    }

    public List<ParticipantEntryAmount> getAllocationsByParticipant(UUID participantId) {
        return allocationRepository.findByTemplateParticipantId(participantId);
    }

    public List<ParticipantEntryAmount> getAllAllocations() {
        return allocationRepository.findAll();
    }

    public ParticipantEntryAmount updateAllocation(UUID allocationId, BigDecimal amount) {
        ParticipantEntryAmount allocation = getAllocationById(allocationId);
        allocation.setAmount(amount);
        return allocationRepository.save(allocation);
    }

    public void deleteAllocation(UUID allocationId) {
        allocationRepository.deleteById(allocationId);
    }

    // Batch Operations
    public void deleteAllocationsByFieldValue(UUID fieldValueId) {
        List<ParticipantEntryAmount> allocations = getAllocationsByFieldValue(fieldValueId);
        allocationRepository.deleteAll(allocations);
    }

    public void deleteAllocationsByParticipant(UUID participantId) {
        List<ParticipantEntryAmount> allocations = getAllocationsByParticipant(participantId);
        allocationRepository.deleteAll(allocations);
    }

    // Utility Methods
    public BigDecimal getTotalAllocationForParticipantInInstance(UUID instanceId, UUID participantId) {
        InstanceFieldValue dummy = new InstanceFieldValue();
        TemplateInstance instance = instanceService.getInstanceById(instanceId);
        List<InstanceFieldValue> fieldValues = instanceService.getFieldValuesByInstance(instanceId);

        BigDecimal total = BigDecimal.ZERO;
        for (InstanceFieldValue fieldValue : fieldValues) {
            List<ParticipantEntryAmount> allocations = getAllocationsByFieldValue(fieldValue.getId());
            for (ParticipantEntryAmount allocation : allocations) {
                if (allocation.getTemplateParticipant().getId().equals(participantId)) {
                    total = total.add(allocation.getAmount());
                }
            }
        }
        return total;
    }
}