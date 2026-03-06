package com.expensesplitter.controller;

import com.expensesplitter.entity.*;
import com.expensesplitter.enums.FieldType;
import com.expensesplitter.service.ApiResponse;
import com.expensesplitter.service.TemplateService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    // Template Endpoints
    @PostMapping
    public ResponseEntity<ApiResponse<Template>> createTemplate(
            @RequestParam UUID userId,
            @RequestParam String name,
            @RequestParam(required = false) String description) {
        Template template = templateService.createTemplate(userId, name, description);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, template, "Template created successfully"));
    }

    @GetMapping("/{templateId}")
    public ResponseEntity<ApiResponse<Template>> getTemplate(@PathVariable UUID templateId) {
        Template template = templateService.getTemplateById(templateId);
        return ResponseEntity.ok(new ApiResponse<>(true, template));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Template>>> getTemplatesByUser(@PathVariable UUID userId) {
        List<Template> templates = templateService.getTemplatesByUserId(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, templates));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Template>>> getAllTemplates() {
        List<Template> templates = templateService.getAllTemplates();
        return ResponseEntity.ok(new ApiResponse<>(true, templates));
    }

    @PutMapping("/{templateId}")
    public ResponseEntity<ApiResponse<Template>> updateTemplate(
            @PathVariable UUID templateId,
            @RequestParam String name,
            @RequestParam(required = false) String description) {
        Template template = templateService.updateTemplate(templateId, name, description);
        return ResponseEntity.ok(new ApiResponse<>(true, template, "Template updated successfully"));
    }

    @DeleteMapping("/{templateId}")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID templateId) {
        templateService.deleteTemplate(templateId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Template deleted successfully"));
    }

    // Participant Endpoints
    @PostMapping("/{templateId}/participants")
    public ResponseEntity<ApiResponse<TemplateParticipant>> addParticipant(
            @PathVariable UUID templateId,
            @RequestParam String name,
            @RequestParam int displayOrder) {
        TemplateParticipant participant = templateService.addParticipant(templateId, name, displayOrder);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, participant, "Participant added successfully"));
    }

    @GetMapping("/{templateId}/participants")
    public ResponseEntity<ApiResponse<List<TemplateParticipant>>> getParticipants(@PathVariable UUID templateId) {
        List<TemplateParticipant> participants = templateService.getParticipantsByTemplate(templateId);
        return ResponseEntity.ok(new ApiResponse<>(true, participants));
    }

    @DeleteMapping("/participants/{participantId}")
    public ResponseEntity<ApiResponse<Void>> deleteParticipant(@PathVariable UUID participantId) {
        templateService.deleteParticipant(participantId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Participant deleted successfully"));
    }

    // Split Rule Endpoints
    @PostMapping("/{templateId}/split-rules")
    public ResponseEntity<ApiResponse<SplitRule>> createSplitRule(
            @PathVariable UUID templateId,
            @RequestParam String name) {
        SplitRule splitRule = templateService.createSplitRule(templateId, name);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, splitRule, "Split rule created successfully"));
    }

    @GetMapping("/{templateId}/split-rules")
    public ResponseEntity<ApiResponse<List<SplitRule>>> getSplitRules(@PathVariable UUID templateId) {
        List<SplitRule> splitRules = templateService.getSplitRulesByTemplate(templateId);
        return ResponseEntity.ok(new ApiResponse<>(true, splitRules));
    }

    @DeleteMapping("/split-rules/{splitRuleId}")
    public ResponseEntity<ApiResponse<Void>> deleteSplitRule(@PathVariable UUID splitRuleId) {
        templateService.deleteSplitRule(splitRuleId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Split rule deleted successfully"));
    }

    // Split Rule Allocation Endpoints
    @PostMapping("/split-rules/{splitRuleId}/allocations")
    public ResponseEntity<ApiResponse<SplitRuleAllocation>> addAllocationToRule(
            @PathVariable UUID splitRuleId,
            @RequestParam UUID participantId,
            @RequestParam BigDecimal percent) {
        SplitRuleAllocation allocation = templateService.addAllocationToRule(splitRuleId, participantId, percent);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, allocation, "Allocation added successfully"));
    }

    @GetMapping("/split-rules/{splitRuleId}/allocations")
    public ResponseEntity<ApiResponse<List<SplitRuleAllocation>>> getAllocationsForRule(@PathVariable UUID splitRuleId) {
        List<SplitRuleAllocation> allocations = templateService.getAllocationsForRule(splitRuleId);
        return ResponseEntity.ok(new ApiResponse<>(true, allocations));
    }

    @DeleteMapping("/allocations/{allocationId}")
    public ResponseEntity<ApiResponse<Void>> deleteAllocation(@PathVariable UUID allocationId) {
        templateService.deleteAllocation(allocationId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Allocation deleted successfully"));
    }

    // Template Field Endpoints
    @PostMapping("/{templateId}/fields")
    public ResponseEntity<ApiResponse<TemplateField>> addField(
            @PathVariable UUID templateId,
            @RequestParam String label,
            @RequestParam FieldType fieldType,
            @RequestParam(required = false) UUID defaultSplitRuleId,
            @RequestParam int displayOrder,
            @RequestParam(required = false) BigDecimal defaultAmount) {
        TemplateField field = templateService.addField(templateId, label, fieldType, defaultSplitRuleId, displayOrder, defaultAmount);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, field, "Field added successfully"));
    }

    @GetMapping("/{templateId}/fields")
    public ResponseEntity<ApiResponse<List<TemplateField>>> getFields(@PathVariable UUID templateId) {
        List<TemplateField> fields = templateService.getFieldsByTemplate(templateId);
        return ResponseEntity.ok(new ApiResponse<>(true, fields));
    }

    @DeleteMapping("/fields/{fieldId}")
    public ResponseEntity<ApiResponse<Void>> deleteField(@PathVariable UUID fieldId) {
        templateService.deleteField(fieldId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Field deleted successfully"));
    }
}