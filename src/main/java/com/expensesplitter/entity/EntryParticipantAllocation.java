package com.expensesplitter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "entry_participant_allocation")
@Getter
@Setter
@NoArgsConstructor
public class EntryParticipantAllocation {

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