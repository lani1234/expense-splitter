package com.expensesplitter.repository;

import com.expensesplitter.entity.TemplateField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TemplateFieldRepository extends JpaRepository<TemplateField, UUID> {
    List<TemplateField> findByTemplateIdOrderByDisplayOrder(UUID templateId);
}