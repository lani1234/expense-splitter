package com.expensesplitter.repository;

import com.expensesplitter.entity.TemplateFieldDefaultParticipantAmount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TemplateFieldDefaultParticipantAmountRepository extends JpaRepository<TemplateFieldDefaultParticipantAmount, UUID> {
    List<TemplateFieldDefaultParticipantAmount> findByTemplateFieldId(UUID fieldId);
    List<TemplateFieldDefaultParticipantAmount> findByTemplateFieldIdIn(Collection<UUID> fieldIds);
    void deleteByTemplateFieldId(UUID fieldId);
}
