package com.expensesplitter.service;

import com.expensesplitter.dto.ParticipantTotalsResponse;
import com.expensesplitter.entity.*;
import com.expensesplitter.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Transactional
public class ParticipantEntryAmountService {

    private final ParticipantEntryAmountRepository participantEntryAmountRepository;
    private final InstanceService instanceService;
    private final TemplateService templateService;

    public ParticipantEntryAmountService(ParticipantEntryAmountRepository participantEntryAmountRepository,
                                         InstanceService instanceService,
                                         TemplateService templateService) {
        this.participantEntryAmountRepository = participantEntryAmountRepository;
        this.instanceService = instanceService;
        this.templateService = templateService;
    }

    // ParticipantEntryAmount CRUD Operations
    public ParticipantEntryAmount createParticipantEntryAmount(UUID fieldValueId, UUID participantId, BigDecimal amount) {
        if (fieldValueId == null) {
            throw new ValidationException("Field value ID is required");
        }
        if (participantId == null) {
            throw new ValidationException("Participant ID is required");
        }
        if (amount == null) {
            throw new ValidationException("Amount is required");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Amount cannot be negative");
        }

        InstanceFieldValue fieldValue = instanceService.getFieldValueById(fieldValueId);
        TemplateParticipant participant = templateService.getParticipantById(participantId);

        ParticipantEntryAmount participantEntryAmount = new ParticipantEntryAmount();
        participantEntryAmount.setInstanceFieldValue(fieldValue);
        participantEntryAmount.setTemplateParticipant(participant);
        participantEntryAmount.setAmount(amount);
        return participantEntryAmountRepository.save(participantEntryAmount);
    }

    public ParticipantEntryAmount getParticipantEntryAmountById(UUID participantEntryAmountId) {
        return participantEntryAmountRepository.findById(participantEntryAmountId)
                .orElseThrow(() -> new ResourceNotFoundException("ParticipantEntryAmount not found with id: " + participantEntryAmountId));
    }

    public List<ParticipantEntryAmount> getParticipantEntryAmountsByFieldValue(UUID fieldValueId) {
        return participantEntryAmountRepository.findByInstanceFieldValueId(fieldValueId);
    }

    public List<ParticipantEntryAmount> getParticipantEntryAmountsByParticipant(UUID participantId) {
        return participantEntryAmountRepository.findByTemplateParticipantId(participantId);
    }

    public List<ParticipantEntryAmount> getAllParticipantEntryAmounts() {
        return participantEntryAmountRepository.findAll();
    }

    public ParticipantEntryAmount updateParticipantEntryAmount(UUID participantEntryAmountId, BigDecimal amount) {
        if (participantEntryAmountId == null) {
            throw new ValidationException("ParticipantEntryAmount ID is required");
        }
        if (amount == null) {
            throw new ValidationException("Amount is required");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Amount cannot be negative");
        }

        ParticipantEntryAmount participantEntryAmount = getParticipantEntryAmountById(participantEntryAmountId);
        participantEntryAmount.setAmount(amount);
        return participantEntryAmountRepository.save(participantEntryAmount);
    }

    public void deleteParticipantEntryAmount(UUID participantEntryAmountId) {
        participantEntryAmountRepository.deleteById(participantEntryAmountId);
    }

    // Batch Operations
    public void deleteAllParticipantEntryAmountsByFieldValue(UUID fieldValueId) {
        List<ParticipantEntryAmount> participantEntryAmounts = getParticipantEntryAmountsByFieldValue(fieldValueId);
        participantEntryAmountRepository.deleteAll(participantEntryAmounts);
    }

    public void deleteAllParticipantEntryAmountsByParticipant(UUID participantId) {
        List<ParticipantEntryAmount> participantEntryAmounts = getParticipantEntryAmountsByParticipant(participantId);
        participantEntryAmountRepository.deleteAll(participantEntryAmounts);
    }

    // Utility Methods
    public ParticipantTotalsResponse getInstanceTotals(UUID instanceId) {
        List<InstanceFieldValue> fieldValues = instanceService.getFieldValuesByInstance(instanceId);

        boolean hasPayers = fieldValues.stream()
                .anyMatch(fv -> fv.getPayerParticipant() != null);

        Map<UUID, BigDecimal> shares = new HashMap<>();
        Map<UUID, BigDecimal> paid = new HashMap<>();

        for (InstanceFieldValue fv : fieldValues) {
            List<ParticipantEntryAmount> amounts = participantEntryAmountRepository.findByInstanceFieldValueId(fv.getId());
            for (ParticipantEntryAmount pea : amounts) {
                UUID pid = pea.getTemplateParticipant().getId();
                shares.merge(pid, pea.getAmount(), BigDecimal::add);
            }
            if (fv.getPayerParticipant() != null) {
                UUID pid = fv.getPayerParticipant().getId();
                paid.merge(pid, fv.getAmount(), BigDecimal::add);
            }
        }

        Map<UUID, BigDecimal> net = new HashMap<>();
        if (hasPayers) {
            Set<UUID> allIds = new HashSet<>(shares.keySet());
            allIds.addAll(paid.keySet());
            for (UUID id : allIds) {
                BigDecimal s = shares.getOrDefault(id, BigDecimal.ZERO);
                BigDecimal p = paid.getOrDefault(id, BigDecimal.ZERO);
                net.put(id, s.subtract(p));
            }
        }

        return new ParticipantTotalsResponse(hasPayers, shares, paid, net);
    }

    public BigDecimal getTotalAmountForParticipantInInstance(UUID instanceId, UUID participantId) {
        List<InstanceFieldValue> fieldValues = instanceService.getFieldValuesByInstance(instanceId);

        BigDecimal total = BigDecimal.ZERO;
        for (InstanceFieldValue fieldValue : fieldValues) {
            List<ParticipantEntryAmount> amounts = getParticipantEntryAmountsByFieldValue(fieldValue.getId());
            for (ParticipantEntryAmount amount : amounts) {
                if (amount.getTemplateParticipant().getId().equals(participantId)) {
                    total = total.add(amount.getAmount());
                }
            }
        }
        return total;
    }
}