package com.expensesplitter.entity;

import com.expensesplitter.enums.SplitMode;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "instance_field_value")
@Getter
@Setter
@NoArgsConstructor
public class InstanceFieldValue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instance_id", nullable = false)
    private TemplateInstance instance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_field_id", nullable = false)
    private TemplateField templateField;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "note")
    private String note;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "split_mode", nullable = false)
    private SplitMode splitMode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "override_split_rule_id")
    private SplitRule overrideSplitRule;

    @PrePersist
    protected void onCreate() {
        if (this.splitMode == null) {
            this.splitMode = SplitMode.DEFAULT;
        }
    }
}