package com.expensesplitter.repository;

import com.expensesplitter.entity.SplitRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SplitRuleRepository extends JpaRepository<SplitRule, UUID> {
    List<SplitRule> findByTemplateId(UUID templateId);
}