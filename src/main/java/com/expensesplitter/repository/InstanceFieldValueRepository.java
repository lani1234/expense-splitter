package com.expensesplitter.repository;

import com.expensesplitter.entity.InstanceFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InstanceFieldValueRepository extends JpaRepository<InstanceFieldValue, UUID> {
    List<InstanceFieldValue> findByInstanceIdOrderByCreatedAtAsc(UUID instanceId);
    List<InstanceFieldValue> findByInstanceIdAndTemplateFieldIdOrderByCreatedAtAsc(UUID instanceId, UUID templateFieldId);
}