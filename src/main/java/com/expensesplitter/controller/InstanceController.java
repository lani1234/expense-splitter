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
        try {
            TemplateInstance instance = instanceService.createInstance(templateId, name);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, instance, "Instance created successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error creating instance: " + e.getMessage()));
        }
    }

    @GetMapping("/{instanceId}")
    public ResponseEntity<ApiResponse<TemplateInstance>> getInstance(@PathVariable UUID instanceId) {
        try {
            TemplateInstance instance = instanceService.getInstanceById(instanceId);
            return ResponseEntity.ok(new ApiResponse<>(true, instance));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "Instance not found: " + e.getMessage()));
        }
    }

    @GetMapping("/template/{templateId}")
    public ResponseEntity<ApiResponse<List<TemplateInstance>>> getInstancesByTemplate(@PathVariable UUID templateId) {
        try {
            List<TemplateInstance> instances = instanceService.getInstancesByTemplate(templateId);
            return ResponseEntity.ok(new ApiResponse<>(true, instances));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching instances: " + e.getMessage()));
        }
    }

    @GetMapping("/template/{templateId}/status/{status}")
    public ResponseEntity<ApiResponse<List<TemplateInstance>>> getInstancesByTemplateAndStatus(
            @PathVariable UUID templateId,
            @PathVariable InstanceStatus status) {
        try {
            List<TemplateInstance> instances = instanceService.getInstancesByTemplateAndStatus(templateId, status);
            return ResponseEntity.ok(new ApiResponse<>(true, instances));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching instances: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TemplateInstance>>> getAllInstances() {
        try {
            List<TemplateInstance> instances = instanceService.getAllInstances();
            return ResponseEntity.ok(new ApiResponse<>(true, instances));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching instances: " + e.getMessage()));
        }
    }

    @PutMapping("/{instanceId}/name")
    public ResponseEntity<ApiResponse<TemplateInstance>> updateInstanceName(
            @PathVariable UUID instanceId,
            @RequestParam String name) {
        try {
            TemplateInstance instance = instanceService.updateInstanceName(instanceId, name);
            return ResponseEntity.ok(new ApiResponse<>(true, instance, "Instance name updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error updating instance: " + e.getMessage()));
        }
    }

    @PutMapping("/{instanceId}/settle")
    public ResponseEntity<ApiResponse<TemplateInstance>> markInstanceAsSettled(@PathVariable UUID instanceId) {
        try {
            TemplateInstance instance = instanceService.markInstanceAsSettled(instanceId);
            return ResponseEntity.ok(new ApiResponse<>(true, instance, "Instance marked as settled"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error settling instance: " + e.getMessage()));
        }
    }

    @PutMapping("/{instanceId}/reopen")
    public ResponseEntity<ApiResponse<TemplateInstance>> markInstanceAsInProgress(@PathVariable UUID instanceId) {
        try {
            TemplateInstance instance = instanceService.markInstanceAsInProgress(instanceId);
            return ResponseEntity.ok(new ApiResponse<>(true, instance, "Instance reopened"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error reopening instance: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{instanceId}")
    public ResponseEntity<ApiResponse<Void>> deleteInstance(@PathVariable UUID instanceId) {
        try {
            instanceService.deleteInstance(instanceId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Instance deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting instance: " + e.getMessage()));
        }
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
        try {
            InstanceFieldValue fieldValue = instanceService.addFieldValue(
                    instanceId, templateFieldId, amount, note, entryDate, splitMode, overrideSplitRuleId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, fieldValue, "Field value added successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error adding field value: " + e.getMessage()));
        }
    }

    @GetMapping("/{instanceId}/field-values")
    public ResponseEntity<ApiResponse<List<InstanceFieldValue>>> getFieldValuesByInstance(@PathVariable UUID instanceId) {
        try {
            List<InstanceFieldValue> fieldValues = instanceService.getFieldValuesByInstance(instanceId);
            return ResponseEntity.ok(new ApiResponse<>(true, fieldValues));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching field values: " + e.getMessage()));
        }
    }

    @GetMapping("/{instanceId}/field-values/field/{templateFieldId}")
    public ResponseEntity<ApiResponse<List<InstanceFieldValue>>> getFieldValuesByInstanceAndField(
            @PathVariable UUID instanceId,
            @PathVariable UUID templateFieldId) {
        try {
            List<InstanceFieldValue> fieldValues = instanceService.getFieldValuesByInstanceAndField(instanceId, templateFieldId);
            return ResponseEntity.ok(new ApiResponse<>(true, fieldValues));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching field values: " + e.getMessage()));
        }
    }

    @GetMapping("/field-values/{fieldValueId}")
    public ResponseEntity<ApiResponse<InstanceFieldValue>> getFieldValue(@PathVariable UUID fieldValueId) {
        try {
            InstanceFieldValue fieldValue = instanceService.getFieldValueById(fieldValueId);
            return ResponseEntity.ok(new ApiResponse<>(true, fieldValue));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "Field value not found: " + e.getMessage()));
        }
    }

    @PutMapping("/field-values/{fieldValueId}")
    public ResponseEntity<ApiResponse<InstanceFieldValue>> updateFieldValue(
            @PathVariable UUID fieldValueId,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) LocalDate entryDate,
            @RequestParam(required = false) SplitMode splitMode,
            @RequestParam(required = false) UUID overrideSplitRuleId) {
        try {
            InstanceFieldValue fieldValue = instanceService.updateFieldValue(
                    fieldValueId, amount, note, entryDate, splitMode, overrideSplitRuleId);
            return ResponseEntity.ok(new ApiResponse<>(true, fieldValue, "Field value updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error updating field value: " + e.getMessage()));
        }
    }

    @DeleteMapping("/field-values/{fieldValueId}")
    public ResponseEntity<ApiResponse<Void>> deleteFieldValue(@PathVariable UUID fieldValueId) {
        try {
            instanceService.deleteFieldValue(fieldValueId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Field value deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting field value: " + e.getMessage()));
        }
    }
}