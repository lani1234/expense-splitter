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
        try {
            Template template = templateService.createTemplate(userId, name, description);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, template, "Template created successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error creating template: " + e.getMessage()));
        }
    }

    @GetMapping("/{templateId}")
    public ResponseEntity<ApiResponse<Template>> getTemplate(@PathVariable UUID templateId) {
        try {
            Template template = templateService.getTemplateById(templateId);
            return ResponseEntity.ok(new ApiResponse<>(true, template));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "Template not found: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Template>>> getTemplatesByUser(@PathVariable UUID userId) {
        try {
            List<Template> templates = templateService.getTemplatesByUserId(userId);
            return ResponseEntity.ok(new ApiResponse<>(true, templates));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching templates: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Template>>> getAllTemplates() {
        try {
            List<Template> templates = templateService.getAllTemplates();
            return ResponseEntity.ok(new ApiResponse<>(true, templates));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching templates: " + e.getMessage()));
        }
    }

    @PutMapping("/{templateId}")
    public ResponseEntity<ApiResponse<Template>> updateTemplate(
            @PathVariable UUID templateId,
            @RequestParam String name,
            @RequestParam(required = false) String description) {
        try {
            Template template = templateService.updateTemplate(templateId, name, description);
            return ResponseEntity.ok(new ApiResponse<>(true, template, "Template updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error updating template: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{templateId}")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID templateId) {
        try {
            templateService.deleteTemplate(templateId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Template deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting template: " + e.getMessage()));
        }
    }

    // Participant Endpoints
    @PostMapping("/{templateId}/participants")
    public ResponseEntity<ApiResponse<TemplateParticipant>> addParticipant(
            @PathVariable UUID templateId,
            @RequestParam String name,
            @RequestParam int displayOrder) {
        try {
            TemplateParticipant participant = templateService.addParticipant(templateId, name, displayOrder);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, participant, "Participant added successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error adding participant: " + e.getMessage()));
        }
    }

    @GetMapping("/{templateId}/participants")
    public ResponseEntity<ApiResponse<List<TemplateParticipant>>> getParticipants(@PathVariable UUID templateId) {
        try {
            List<TemplateParticipant> participants = templateService.getParticipantsByTemplate(templateId);
            return ResponseEntity.ok(new ApiResponse<>(true, participants));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching participants: " + e.getMessage()));
        }
    }

    @DeleteMapping("/participants/{participantId}")
    public ResponseEntity<ApiResponse<Void>> deleteParticipant(@PathVariable UUID participantId) {
        try {
            templateService.deleteParticipant(participantId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Participant deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting participant: " + e.getMessage()));
        }
    }

    // Split Rule Endpoints
    @PostMapping("/{templateId}/split-rules")
    public ResponseEntity<ApiResponse<SplitRule>> createSplitRule(
            @PathVariable UUID templateId,
            @RequestParam String name) {
        try {
            SplitRule splitRule = templateService.createSplitRule(templateId, name);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, splitRule, "Split rule created successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error creating split rule: " + e.getMessage()));
        }
    }

    @GetMapping("/{templateId}/split-rules")
    public ResponseEntity<ApiResponse<List<SplitRule>>> getSplitRules(@PathVariable UUID templateId) {
        try {
            List<SplitRule> splitRules = templateService.getSplitRulesByTemplate(templateId);
            return ResponseEntity.ok(new ApiResponse<>(true, splitRules));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching split rules: " + e.getMessage()));
        }
    }

    @DeleteMapping("/split-rules/{splitRuleId}")
    public ResponseEntity<ApiResponse<Void>> deleteSplitRule(@PathVariable UUID splitRuleId) {
        try {
            templateService.deleteSplitRule(splitRuleId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Split rule deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting split rule: " + e.getMessage()));
        }
    }

    // Split Rule Allocation Endpoints
    @PostMapping("/split-rules/{splitRuleId}/allocations")
    public ResponseEntity<ApiResponse<SplitRuleAllocation>> addAllocationToRule(
            @PathVariable UUID splitRuleId,
            @RequestParam UUID participantId,
            @RequestParam BigDecimal percent) {
        try {
            SplitRuleAllocation allocation = templateService.addAllocationToRule(splitRuleId, participantId, percent);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, allocation, "Allocation added successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error adding allocation: " + e.getMessage()));
        }
    }

    @GetMapping("/split-rules/{splitRuleId}/allocations")
    public ResponseEntity<ApiResponse<List<SplitRuleAllocation>>> getAllocationsForRule(@PathVariable UUID splitRuleId) {
        try {
            List<SplitRuleAllocation> allocations = templateService.getAllocationsForRule(splitRuleId);
            return ResponseEntity.ok(new ApiResponse<>(true, allocations));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching allocations: " + e.getMessage()));
        }
    }

    @DeleteMapping("/allocations/{allocationId}")
    public ResponseEntity<ApiResponse<Void>> deleteAllocation(@PathVariable UUID allocationId) {
        try {
            templateService.deleteAllocation(allocationId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Allocation deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting allocation: " + e.getMessage()));
        }
    }

    // Template Field Endpoints
    @PostMapping("/{templateId}/fields")
    public ResponseEntity<ApiResponse<TemplateField>> addField(
            @PathVariable UUID templateId,
            @RequestParam String label,
            @RequestParam FieldType fieldType,
            @RequestParam(required = false) UUID defaultSplitRuleId,
            @RequestParam int displayOrder) {
        try {
            TemplateField field = templateService.addField(templateId, label, fieldType, defaultSplitRuleId, displayOrder);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, field, "Field added successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error adding field: " + e.getMessage()));
        }
    }

    @GetMapping("/{templateId}/fields")
    public ResponseEntity<ApiResponse<List<TemplateField>>> getFields(@PathVariable UUID templateId) {
        try {
            List<TemplateField> fields = templateService.getFieldsByTemplate(templateId);
            return ResponseEntity.ok(new ApiResponse<>(true, fields));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching fields: " + e.getMessage()));
        }
    }

    @DeleteMapping("/fields/{fieldId}")
    public ResponseEntity<ApiResponse<Void>> deleteField(@PathVariable UUID fieldId) {
        try {
            templateService.deleteField(fieldId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Field deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting field: " + e.getMessage()));
        }
    }
}