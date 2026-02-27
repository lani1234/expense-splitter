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
public class CalculationService {

    private final ParticipantEntryAmountRepository participantEntryAmountRepository;
    private final InstanceService instanceService;
    private final TemplateService templateService;

    public CalculationService(ParticipantEntryAmountRepository participantEntryAmountRepository,
                              InstanceService instanceService,
                              TemplateService templateService) {
        this.participantEntryAmountRepository = participantEntryAmountRepository;
        this.instanceService = instanceService;
        this.templateService = templateService;
    }

    // ParticipantEntryAmount CRUD Operations
    public ParticipantEntryAmount createParticipantEntryAmount(UUID fieldValueId, UUID participantId, BigDecimal amount) {
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
                .orElseThrow(() -> new RuntimeException("ParticipantEntryAmount not found with id: " + participantEntryAmountId));
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