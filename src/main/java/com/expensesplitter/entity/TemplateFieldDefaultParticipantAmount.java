package com.expensesplitter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "template_field_default_participant_amount")
@Getter
@Setter
@NoArgsConstructor
public class TemplateFieldDefaultParticipantAmount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_field_id", nullable = false)
    private TemplateField templateField;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_participant_id", nullable = false)
    private TemplateParticipant templateParticipant;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;
}
