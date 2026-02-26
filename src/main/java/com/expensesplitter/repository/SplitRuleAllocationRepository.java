package com.expensesplitter.repository;

import com.expensesplitter.entity.SplitRuleAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SplitRuleAllocationRepository extends JpaRepository<SplitRuleAllocation, UUID> {
    List<SplitRuleAllocation> findBySplitRuleId(UUID splitRuleId);
}