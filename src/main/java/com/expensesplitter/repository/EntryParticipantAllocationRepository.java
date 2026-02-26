package com.expensesplitter.repository;

import com.expensesplitter.entity.EntryParticipantAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EntryParticipantAllocationRepository extends JpaRepository<EntryParticipantAllocation, UUID> {
    List<EntryParticipantAllocation> findByInstanceFieldValueId(UUID instanceFieldValueId);
    List<EntryParticipantAllocation> findByTemplateParticipantId(UUID templateParticipantId);
}