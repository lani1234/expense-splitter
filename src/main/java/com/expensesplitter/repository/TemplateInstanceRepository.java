package com.expensesplitter.repository;

import com.expensesplitter.entity.TemplateInstance;
import com.expensesplitter.enums.InstanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TemplateInstanceRepository extends JpaRepository<TemplateInstance, UUID> {
    List<TemplateInstance> findByTemplateId(UUID templateId);
    List<TemplateInstance> findByTemplateIdAndStatus(UUID templateId, InstanceStatus status);
}