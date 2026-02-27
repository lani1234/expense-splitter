package com.expensesplitter.controller;

import com.expensesplitter.entity.ParticipantEntryAmount;
import com.expensesplitter.service.CalculationService;
import com.expensesplitter.service.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/calculations")
public class CalculationController {

    private final CalculationService calculationService;

    public CalculationController(CalculationService calculationService) {
        this.calculationService = calculationService;
    }

    // ParticipantEntryAmount CRUD Operations
    @PostMapping
    public ResponseEntity<ApiResponse<ParticipantEntryAmount>> createParticipantEntryAmount(
            @RequestParam UUID fieldValueId,
            @RequestParam UUID participantId,
            @RequestParam BigDecimal amount) {
        try {
            ParticipantEntryAmount participantEntryAmount = calculationService.createParticipantEntryAmount(fieldValueId, participantId, amount);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, participantEntryAmount, "ParticipantEntryAmount created successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error creating ParticipantEntryAmount: " + e.getMessage()));
        }
    }

    @GetMapping("/{participantEntryAmountId}")
    public ResponseEntity<ApiResponse<ParticipantEntryAmount>> getParticipantEntryAmount(@PathVariable UUID participantEntryAmountId) {
        try {
            ParticipantEntryAmount participantEntryAmount = calculationService.getParticipantEntryAmountById(participantEntryAmountId);
            return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmount));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "ParticipantEntryAmount not found: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmount>>> getAllParticipantEntryAmounts() {
        try {
            List<ParticipantEntryAmount> participantEntryAmounts = calculationService.getAllParticipantEntryAmounts();
            return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmounts));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching ParticipantEntryAmounts: " + e.getMessage()));
        }
    }

    @PutMapping("/{participantEntryAmountId}")
    public ResponseEntity<ApiResponse<ParticipantEntryAmount>> updateParticipantEntryAmount(
            @PathVariable UUID participantEntryAmountId,
            @RequestParam BigDecimal amount) {
        try {
            ParticipantEntryAmount participantEntryAmount = calculationService.updateParticipantEntryAmount(participantEntryAmountId, amount);
            return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmount, "ParticipantEntryAmount updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error updating ParticipantEntryAmount: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{participantEntryAmountId}")
    public ResponseEntity<ApiResponse<Void>> deleteParticipantEntryAmount(@PathVariable UUID participantEntryAmountId) {
        try {
            calculationService.deleteParticipantEntryAmount(participantEntryAmountId);
            return ResponseEntity.ok(new ApiResponse<>(true, "ParticipantEntryAmount deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting ParticipantEntryAmount: " + e.getMessage()));
        }
    }

    // Query Endpoints
    @GetMapping("/field-value/{fieldValueId}")
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmount>>> getParticipantEntryAmountsByFieldValue(
            @PathVariable UUID fieldValueId) {
        try {
            List<ParticipantEntryAmount> participantEntryAmounts = calculationService.getParticipantEntryAmountsByFieldValue(fieldValueId);
            return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmounts));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching ParticipantEntryAmounts: " + e.getMessage()));
        }
    }

    @GetMapping("/participant/{participantId}")
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmount>>> getParticipantEntryAmountsByParticipant(
            @PathVariable UUID participantId) {
        try {
            List<ParticipantEntryAmount> participantEntryAmounts = calculationService.getParticipantEntryAmountsByParticipant(participantId);
            return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmounts));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching ParticipantEntryAmounts: " + e.getMessage()));
        }
    }

    // Batch Operations
    @DeleteMapping("/field-value/{fieldValueId}")
    public ResponseEntity<ApiResponse<Void>> deleteAllParticipantEntryAmountsByFieldValue(@PathVariable UUID fieldValueId) {
        try {
            calculationService.deleteAllParticipantEntryAmountsByFieldValue(fieldValueId);
            return ResponseEntity.ok(new ApiResponse<>(true, "ParticipantEntryAmounts deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting ParticipantEntryAmounts: " + e.getMessage()));
        }
    }

    @DeleteMapping("/participant/{participantId}")
    public ResponseEntity<ApiResponse<Void>> deleteAllParticipantEntryAmountsByParticipant(@PathVariable UUID participantId) {
        try {
            calculationService.deleteAllParticipantEntryAmountsByParticipant(participantId);
            return ResponseEntity.ok(new ApiResponse<>(true, "ParticipantEntryAmounts deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting ParticipantEntryAmounts: " + e.getMessage()));
        }
    }

    // Utility Endpoints
    @GetMapping("/instance/{instanceId}/participant/{participantId}/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalAmountForParticipantInInstance(
            @PathVariable UUID instanceId,
            @PathVariable UUID participantId) {
        try {
            BigDecimal total = calculationService.getTotalAmountForParticipantInInstance(instanceId, participantId);
            return ResponseEntity.ok(new ApiResponse<>(true, total));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error calculating total: " + e.getMessage()));
        }
    }
}