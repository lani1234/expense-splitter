package com.expensesplitter.entity;

import com.expensesplitter.enums.FieldType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "template_field")
@Getter
@Setter
@NoArgsConstructor
public class TemplateField {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private Template template;

    @Column(name = "label", nullable = false)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(name = "field_type", nullable = false)
    private FieldType fieldType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_split_rule_id")
    private SplitRule defaultSplitRule;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;
}