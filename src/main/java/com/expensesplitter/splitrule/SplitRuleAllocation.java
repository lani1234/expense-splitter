package com.expensesplitter.splitrule;

import com.expensesplitter.participant.TemplateParticipant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "split_rule_allocation")
@Getter
@Setter
@NoArgsConstructor
public class SplitRuleAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "split_rule_id", nullable = false)
    private SplitRule splitRule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_participant_id", nullable = false)
    private TemplateParticipant templateParticipant;

    @Column(name = "percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal percent;
}