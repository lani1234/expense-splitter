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

    private final EntryParticipantAllocationRepository allocationRepository;
    private final InstanceService instanceService;
    private final TemplateService templateService;

    public AllocationService(EntryParticipantAllocationRepository allocationRepository,
                             InstanceService instanceService,
                             TemplateService templateService) {
        this.allocationRepository = allocationRepository;
        this.instanceService = instanceService;
        this.templateService = templateService;
    }

    // Allocation CRUD Operations
    public EntryParticipantAllocation createAllocation(UUID fieldValueId, UUID participantId, BigDecimal amount) {
        InstanceFieldValue fieldValue = instanceService.getFieldValueById(fieldValueId);
        TemplateParticipant participant = templateService.getParticipantById(participantId);

        EntryParticipantAllocation allocation = new EntryParticipantAllocation();
        allocation.setInstanceFieldValue(fieldValue);
        allocation.setTemplateParticipant(participant);
        allocation.setAmount(amount);
        return allocationRepository.save(allocation);
    }

    public EntryParticipantAllocation getAllocationById(UUID allocationId) {
        return allocationRepository.findById(allocationId)
                .orElseThrow(() -> new RuntimeException("Allocation not found with id: " + allocationId));
    }

    public List<EntryParticipantAllocation> getAllocationsByFieldValue(UUID fieldValueId) {
        return allocationRepository.findByInstanceFieldValueId(fieldValueId);
    }

    public List<EntryParticipantAllocation> getAllocationsByParticipant(UUID participantId) {
        return allocationRepository.findByTemplateParticipantId(participantId);
    }

    public List<EntryParticipantAllocation> getAllAllocations() {
        return allocationRepository.findAll();
    }

    public EntryParticipantAllocation updateAllocation(UUID allocationId, BigDecimal amount) {
        EntryParticipantAllocation allocation = getAllocationById(allocationId);
        allocation.setAmount(amount);
        return allocationRepository.save(allocation);
    }

    public void deleteAllocation(UUID allocationId) {
        allocationRepository.deleteById(allocationId);
    }

    // Batch Operations
    public void deleteAllocationsByFieldValue(UUID fieldValueId) {
        List<EntryParticipantAllocation> allocations = getAllocationsByFieldValue(fieldValueId);
        allocationRepository.deleteAll(allocations);
    }

    public void deleteAllocationsByParticipant(UUID participantId) {
        List<EntryParticipantAllocation> allocations = getAllocationsByParticipant(participantId);
        allocationRepository.deleteAll(allocations);
    }

    // Utility Methods
    public BigDecimal getTotalAllocationForParticipantInInstance(UUID instanceId, UUID participantId) {
        InstanceFieldValue dummy = new InstanceFieldValue();
        TemplateInstance instance = instanceService.getInstanceById(instanceId);
        List<InstanceFieldValue> fieldValues = instanceService.getFieldValuesByInstance(instanceId);

        BigDecimal total = BigDecimal.ZERO;
        for (InstanceFieldValue fieldValue : fieldValues) {
            List<EntryParticipantAllocation> allocations = getAllocationsByFieldValue(fieldValue.getId());
            for (EntryParticipantAllocation allocation : allocations) {
                if (allocation.getTemplateParticipant().getId().equals(participantId)) {
                    total = total.add(allocation.getAmount());
                }
            }
        }
        return total;
    }
}