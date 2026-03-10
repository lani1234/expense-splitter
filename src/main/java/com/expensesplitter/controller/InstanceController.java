package com.expensesplitter.controller;

import com.expensesplitter.entity.InstanceFieldValue;
import com.expensesplitter.entity.TemplateInstance;
import com.expensesplitter.enums.InstanceStatus;
import com.expensesplitter.enums.SplitMode;
import com.expensesplitter.service.ApiResponse;
import com.expensesplitter.service.InstanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/instances")
public class InstanceController {

    private final InstanceService instanceService;

    public InstanceController(InstanceService instanceService) {
        this.instanceService = instanceService;
    }

    // Instance Endpoints
    @PostMapping
    public ResponseEntity<ApiResponse<TemplateInstance>> createInstance(
            @RequestParam UUID templateId,
            @RequestParam String name) {
        TemplateInstance instance = instanceService.createInstance(templateId, name);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, instance, "Instance created successfully"));
    }

    @GetMapping("/{instanceId}")
    public ResponseEntity<ApiResponse<TemplateInstance>> getInstance(@PathVariable UUID instanceId) {
        TemplateInstance instance = instanceService.getInstanceById(instanceId);
        return ResponseEntity.ok(new ApiResponse<>(true, instance));
    }

    @GetMapping("/template/{templateId}")
    public ResponseEntity<ApiResponse<List<TemplateInstance>>> getInstancesByTemplate(@PathVariable UUID templateId) {
        List<TemplateInstance> instances = instanceService.getInstancesByTemplate(templateId);
        return ResponseEntity.ok(new ApiResponse<>(true, instances));
    }

    @GetMapping("/template/{templateId}/status/{status}")
    public ResponseEntity<ApiResponse<List<TemplateInstance>>> getInstancesByTemplateAndStatus(
            @PathVariable UUID templateId,
            @PathVariable InstanceStatus status) {
        List<TemplateInstance> instances = instanceService.getInstancesByTemplateAndStatus(templateId, status);
        return ResponseEntity.ok(new ApiResponse<>(true, instances));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TemplateInstance>>> getAllInstances() {
        List<TemplateInstance> instances = instanceService.getAllInstances();
        return ResponseEntity.ok(new ApiResponse<>(true, instances));
    }

    @PutMapping("/{instanceId}/name")
    public ResponseEntity<ApiResponse<TemplateInstance>> updateInstanceName(
            @PathVariable UUID instanceId,
            @RequestParam String name) {
        TemplateInstance instance = instanceService.updateInstanceName(instanceId, name);
        return ResponseEntity.ok(new ApiResponse<>(true, instance, "Instance name updated successfully"));
    }

    @PutMapping("/{instanceId}/settle")
    public ResponseEntity<ApiResponse<TemplateInstance>> markInstanceAsSettled(@PathVariable UUID instanceId) {
        TemplateInstance instance = instanceService.markInstanceAsSettled(instanceId);
        return ResponseEntity.ok(new ApiResponse<>(true, instance, "Instance marked as settled"));
    }

    @PutMapping("/{instanceId}/reopen")
    public ResponseEntity<ApiResponse<TemplateInstance>> markInstanceAsInProgress(@PathVariable UUID instanceId) {
        TemplateInstance instance = instanceService.markInstanceAsInProgress(instanceId);
        return ResponseEntity.ok(new ApiResponse<>(true, instance, "Instance reopened"));
    }

    @DeleteMapping("/{instanceId}")
    public ResponseEntity<ApiResponse<Void>> deleteInstance(@PathVariable UUID instanceId) {
        instanceService.deleteInstance(instanceId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Instance deleted successfully"));
    }

    // Field Value Endpoints
    @PostMapping("/{instanceId}/field-values")
    public ResponseEntity<ApiResponse<InstanceFieldValue>> addFieldValue(
            @PathVariable UUID instanceId,
            @RequestParam UUID templateFieldId,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) LocalDate entryDate,
            @RequestParam(required = false) SplitMode splitMode,
            @RequestParam(required = false) UUID overrideSplitRuleId) {
        InstanceFieldValue fieldValue = instanceService.addFieldValue(
                instanceId, templateFieldId, amount, note, entryDate, splitMode, overrideSplitRuleId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, fieldValue, "Field value added successfully"));
    }

    @GetMapping("/{instanceId}/field-values")
    public ResponseEntity<ApiResponse<List<InstanceFieldValue>>> getFieldValuesByInstance(@PathVariable UUID instanceId) {
        List<InstanceFieldValue> fieldValues = instanceService.getFieldValuesByInstance(instanceId);
        return ResponseEntity.ok(new ApiResponse<>(true, fieldValues));
    }

    @GetMapping("/{instanceId}/field-values/field/{templateFieldId}")
    public ResponseEntity<ApiResponse<List<InstanceFieldValue>>> getFieldValuesByInstanceAndField(
            @PathVariable UUID instanceId,
            @PathVariable UUID templateFieldId) {
        List<InstanceFieldValue> fieldValues = instanceService.getFieldValuesByInstanceAndField(instanceId, templateFieldId);
        return ResponseEntity.ok(new ApiResponse<>(true, fieldValues));
    }

    @GetMapping("/field-values/{fieldValueId}")
    public ResponseEntity<ApiResponse<InstanceFieldValue>> getFieldValue(@PathVariable UUID fieldValueId) {
        InstanceFieldValue fieldValue = instanceService.getFieldValueById(fieldValueId);
        return ResponseEntity.ok(new ApiResponse<>(true, fieldValue));
    }

    @PutMapping("/field-values/{fieldValueId}")
    public ResponseEntity<ApiResponse<InstanceFieldValue>> updateFieldValue(
            @PathVariable UUID fieldValueId,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) LocalDate entryDate,
            @RequestParam(required = false) SplitMode splitMode,
            @RequestParam(required = false) UUID overrideSplitRuleId) {
        InstanceFieldValue fieldValue = instanceService.updateFieldValue(
                fieldValueId, amount, note, entryDate, splitMode, overrideSplitRuleId);
        return ResponseEntity.ok(new ApiResponse<>(true, fieldValue, "Field value updated successfully"));
    }

    @DeleteMapping("/field-values/{fieldValueId}")
    public ResponseEntity<ApiResponse<Void>> deleteFieldValue(@PathVariable UUID fieldValueId) {
        instanceService.deleteFieldValue(fieldValueId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Field value deleted successfully"));
    }

    @PutMapping("/field-values/{fieldValueId}/split-rule")
    public ResponseEntity<ApiResponse<InstanceFieldValue>> updateFieldValueSplitRule(
            @PathVariable UUID fieldValueId,
            @RequestParam UUID splitRuleId) {
        InstanceFieldValue fieldValue = instanceService.updateFieldValueSplitRule(fieldValueId, splitRuleId);
        return ResponseEntity.ok(new ApiResponse<>(true, fieldValue, "Split rule updated successfully"));
    }
}