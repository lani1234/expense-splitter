package com.expensesplitter.controller;

import com.expensesplitter.dto.AddFieldValueRequest;
import com.expensesplitter.dto.InstanceFieldValueResponse;
import com.expensesplitter.dto.TemplateInstanceResponse;
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
    public ResponseEntity<ApiResponse<TemplateInstanceResponse>> createInstance(
            @RequestParam UUID templateId,
            @RequestParam String name) {
        TemplateInstanceResponse instance = TemplateInstanceResponse.from(instanceService.createInstance(templateId, name));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, instance, "Instance created successfully"));
    }

    @GetMapping("/{instanceId}")
    public ResponseEntity<ApiResponse<TemplateInstanceResponse>> getInstance(@PathVariable UUID instanceId) {
        TemplateInstanceResponse instance = TemplateInstanceResponse.from(instanceService.getInstanceById(instanceId));
        return ResponseEntity.ok(new ApiResponse<>(true, instance));
    }

    @GetMapping("/template/{templateId}")
    public ResponseEntity<ApiResponse<List<TemplateInstanceResponse>>> getInstancesByTemplate(@PathVariable UUID templateId) {
        List<TemplateInstanceResponse> instances = instanceService.getInstancesByTemplate(templateId)
                .stream().map(TemplateInstanceResponse::from).toList();
        return ResponseEntity.ok(new ApiResponse<>(true, instances));
    }

    @GetMapping("/template/{templateId}/status/{status}")
    public ResponseEntity<ApiResponse<List<TemplateInstanceResponse>>> getInstancesByTemplateAndStatus(
            @PathVariable UUID templateId,
            @PathVariable InstanceStatus status) {
        List<TemplateInstanceResponse> instances = instanceService.getInstancesByTemplateAndStatus(templateId, status)
                .stream().map(TemplateInstanceResponse::from).toList();
        return ResponseEntity.ok(new ApiResponse<>(true, instances));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TemplateInstanceResponse>>> getAllInstances() {
        List<TemplateInstanceResponse> instances = instanceService.getAllInstances()
                .stream().map(TemplateInstanceResponse::from).toList();
        return ResponseEntity.ok(new ApiResponse<>(true, instances));
    }

    @PutMapping("/{instanceId}/name")
    public ResponseEntity<ApiResponse<TemplateInstanceResponse>> updateInstanceName(
            @PathVariable UUID instanceId,
            @RequestParam String name) {
        TemplateInstanceResponse instance = TemplateInstanceResponse.from(instanceService.updateInstanceName(instanceId, name));
        return ResponseEntity.ok(new ApiResponse<>(true, instance, "Instance name updated successfully"));
    }

    @PutMapping("/{instanceId}/settle")
    public ResponseEntity<ApiResponse<TemplateInstanceResponse>> markInstanceAsSettled(@PathVariable UUID instanceId) {
        TemplateInstanceResponse instance = TemplateInstanceResponse.from(instanceService.markInstanceAsSettled(instanceId));
        return ResponseEntity.ok(new ApiResponse<>(true, instance, "Instance marked as settled"));
    }

    @PutMapping("/{instanceId}/reopen")
    public ResponseEntity<ApiResponse<TemplateInstanceResponse>> markInstanceAsInProgress(@PathVariable UUID instanceId) {
        TemplateInstanceResponse instance = TemplateInstanceResponse.from(instanceService.markInstanceAsInProgress(instanceId));
        return ResponseEntity.ok(new ApiResponse<>(true, instance, "Instance reopened"));
    }

    @DeleteMapping("/{instanceId}")
    public ResponseEntity<ApiResponse<Void>> deleteInstance(@PathVariable UUID instanceId) {
        instanceService.deleteInstance(instanceId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Instance deleted successfully"));
    }

    // Field Value Endpoints
    @PostMapping("/{instanceId}/field-values")
    public ResponseEntity<ApiResponse<InstanceFieldValueResponse>> addFieldValue(
            @PathVariable UUID instanceId,
            @RequestBody AddFieldValueRequest request) {
        InstanceFieldValueResponse fieldValue = InstanceFieldValueResponse.from(instanceService.addFieldValue(instanceId, request));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, fieldValue, "Field value added successfully"));
    }

    @GetMapping("/{instanceId}/field-values")
    public ResponseEntity<ApiResponse<List<InstanceFieldValueResponse>>> getFieldValuesByInstance(@PathVariable UUID instanceId) {
        List<InstanceFieldValueResponse> fieldValues = instanceService.getFieldValuesByInstance(instanceId)
                .stream().map(InstanceFieldValueResponse::from).toList();
        return ResponseEntity.ok(new ApiResponse<>(true, fieldValues));
    }

    @GetMapping("/{instanceId}/field-values/field/{templateFieldId}")
    public ResponseEntity<ApiResponse<List<InstanceFieldValueResponse>>> getFieldValuesByInstanceAndField(
            @PathVariable UUID instanceId,
            @PathVariable UUID templateFieldId) {
        List<InstanceFieldValueResponse> fieldValues = instanceService.getFieldValuesByInstanceAndField(instanceId, templateFieldId)
                .stream().map(InstanceFieldValueResponse::from).toList();
        return ResponseEntity.ok(new ApiResponse<>(true, fieldValues));
    }

    @GetMapping("/field-values/{fieldValueId}")
    public ResponseEntity<ApiResponse<InstanceFieldValueResponse>> getFieldValue(@PathVariable UUID fieldValueId) {
        InstanceFieldValueResponse fieldValue = InstanceFieldValueResponse.from(instanceService.getFieldValueById(fieldValueId));
        return ResponseEntity.ok(new ApiResponse<>(true, fieldValue));
    }

    @PutMapping("/field-values/{fieldValueId}")
    public ResponseEntity<ApiResponse<InstanceFieldValueResponse>> updateFieldValue(
            @PathVariable UUID fieldValueId,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) LocalDate entryDate,
            @RequestParam(required = false) SplitMode splitMode,
            @RequestParam(required = false) UUID overrideSplitRuleId,
            @RequestBody(required = false) java.util.Map<UUID, BigDecimal> participantAmounts) {
        InstanceFieldValueResponse fieldValue = InstanceFieldValueResponse.from(
                instanceService.updateFieldValue(fieldValueId, amount, note, entryDate, splitMode, overrideSplitRuleId, participantAmounts));
        return ResponseEntity.ok(new ApiResponse<>(true, fieldValue, "Field value updated successfully"));
    }

    @DeleteMapping("/field-values/{fieldValueId}")
    public ResponseEntity<ApiResponse<Void>> deleteFieldValue(@PathVariable UUID fieldValueId) {
        instanceService.deleteFieldValue(fieldValueId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Field value deleted successfully"));
    }

    @PutMapping("/field-values/{fieldValueId}/amount")
    public ResponseEntity<ApiResponse<InstanceFieldValueResponse>> updateFieldValueAmount(
            @PathVariable UUID fieldValueId,
            @RequestParam BigDecimal amount) {
        InstanceFieldValueResponse fieldValue = InstanceFieldValueResponse.from(
                instanceService.updateFieldValueAmount(fieldValueId, amount));
        return ResponseEntity.ok(new ApiResponse<>(true, fieldValue, "Field value amount updated successfully"));
    }

    @PutMapping("/field-values/{fieldValueId}/split-rule")
    public ResponseEntity<ApiResponse<InstanceFieldValueResponse>> updateFieldValueSplitRule(
            @PathVariable UUID fieldValueId,
            @RequestParam UUID splitRuleId) {
        InstanceFieldValueResponse fieldValue = InstanceFieldValueResponse.from(
                instanceService.updateFieldValueSplitRule(fieldValueId, splitRuleId));
        return ResponseEntity.ok(new ApiResponse<>(true, fieldValue, "Split rule updated successfully"));
    }

}
