package com.expensesplitter.repository;

import com.expensesplitter.entity.ParticipantEntryAmount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ParticipantEntryAmountRepository extends JpaRepository<ParticipantEntryAmount, UUID> {
    List<ParticipantEntryAmount> findByInstanceFieldValueId(UUID instanceFieldValueId);
    List<ParticipantEntryAmount> findByTemplateParticipantId(UUID templateParticipantId);
}