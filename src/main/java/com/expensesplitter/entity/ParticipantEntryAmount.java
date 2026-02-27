package com.expensesplitter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "participant_entry_amount")
@Getter
@Setter
@NoArgsConstructor
public class ParticipantEntryAmount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    private InstanceFieldValue instanceFieldValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_participant_id", nullable = false)
    private TemplateParticipant templateParticipant;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;
}