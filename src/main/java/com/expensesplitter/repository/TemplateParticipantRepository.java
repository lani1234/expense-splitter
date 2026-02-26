package com.expensesplitter.repository;

import com.expensesplitter.entity.TemplateParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TemplateParticipantRepository extends JpaRepository<TemplateParticipant, UUID> {
    List<TemplateParticipant> findByTemplateIdOrderByDisplayOrder(UUID templateId);
}