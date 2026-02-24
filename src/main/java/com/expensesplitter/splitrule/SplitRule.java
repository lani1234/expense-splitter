package com.expensesplitter.splitrule;

import com.expensesplitter.template.Template;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "split_rule")
@Getter
@Setter
@NoArgsConstructor
public class SplitRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private Template template;

    @Column(name = "name", nullable = false)
    private String name;
}