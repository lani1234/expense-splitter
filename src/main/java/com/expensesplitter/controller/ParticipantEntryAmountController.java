package com.expensesplitter.controller;

import com.expensesplitter.entity.ParticipantEntryAmount;
import com.expensesplitter.service.ParticipantEntryAmountService;
import com.expensesplitter.service.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/participant-entry-amounts")
public class ParticipantEntryAmountController {

    private final ParticipantEntryAmountService participantEntryAmountService;

    public ParticipantEntryAmountController(ParticipantEntryAmountService participantEntryAmountService) {
        this.participantEntryAmountService = participantEntryAmountService;
    }

    // ParticipantEntryAmount CRUD Operations
    @PostMapping
    public ResponseEntity<ApiResponse<ParticipantEntryAmount>> createParticipantEntryAmount(
            @RequestParam UUID fieldValueId,
            @RequestParam UUID participantId,
            @RequestParam BigDecimal amount) {
        ParticipantEntryAmount participantEntryAmount = participantEntryAmountService.createParticipantEntryAmount(fieldValueId, participantId, amount);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, participantEntryAmount, "ParticipantEntryAmount created successfully"));
    }

    @GetMapping("/{participantEntryAmountId}")
    public ResponseEntity<ApiResponse<ParticipantEntryAmount>> getParticipantEntryAmount(@PathVariable UUID participantEntryAmountId) {
        ParticipantEntryAmount participantEntryAmount = participantEntryAmountService.getParticipantEntryAmountById(participantEntryAmountId);
        return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmount));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmount>>> getAllParticipantEntryAmounts() {
        List<ParticipantEntryAmount> participantEntryAmounts = participantEntryAmountService.getAllParticipantEntryAmounts();
        return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmounts));
    }

    @PutMapping("/{participantEntryAmountId}")
    public ResponseEntity<ApiResponse<ParticipantEntryAmount>> updateParticipantEntryAmount(
            @PathVariable UUID participantEntryAmountId,
            @RequestParam BigDecimal amount) {
        ParticipantEntryAmount participantEntryAmount = participantEntryAmountService.updateParticipantEntryAmount(participantEntryAmountId, amount);
        return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmount, "ParticipantEntryAmount updated successfully"));
    }

    @DeleteMapping("/{participantEntryAmountId}")
    public ResponseEntity<ApiResponse<Void>> deleteParticipantEntryAmount(@PathVariable UUID participantEntryAmountId) {
        participantEntryAmountService.deleteParticipantEntryAmount(participantEntryAmountId);
        return ResponseEntity.ok(new ApiResponse<>(true, "ParticipantEntryAmount deleted successfully"));
    }

    // Query Endpoints
    @GetMapping("/field-value/{fieldValueId}")
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmount>>> getParticipantEntryAmountsByFieldValue(
            @PathVariable UUID fieldValueId) {
        List<ParticipantEntryAmount> participantEntryAmounts = participantEntryAmountService.getParticipantEntryAmountsByFieldValue(fieldValueId);
        return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmounts));
    }

    @GetMapping("/participant/{participantId}")
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmount>>> getParticipantEntryAmountsByParticipant(
            @PathVariable UUID participantId) {
        List<ParticipantEntryAmount> participantEntryAmounts = participantEntryAmountService.getParticipantEntryAmountsByParticipant(participantId);
        return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmounts));
    }

    // Batch Operations
    @DeleteMapping("/field-value/{fieldValueId}")
    public ResponseEntity<ApiResponse<Void>> deleteAllParticipantEntryAmountsByFieldValue(@PathVariable UUID fieldValueId) {
        participantEntryAmountService.deleteAllParticipantEntryAmountsByFieldValue(fieldValueId);
        return ResponseEntity.ok(new ApiResponse<>(true, "ParticipantEntryAmounts deleted successfully"));
    }

    @DeleteMapping("/participant/{participantId}")
    public ResponseEntity<ApiResponse<Void>> deleteAllParticipantEntryAmountsByParticipant(@PathVariable UUID participantId) {
        participantEntryAmountService.deleteAllParticipantEntryAmountsByParticipant(participantId);
        return ResponseEntity.ok(new ApiResponse<>(true, "ParticipantEntryAmounts deleted successfully"));
    }

    // Utility Endpoints
    @GetMapping("/instance/{instanceId}/participant/{participantId}/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalAmountForParticipantInInstance(
            @PathVariable UUID instanceId,
            @PathVariable UUID participantId) {
        BigDecimal total = participantEntryAmountService.getTotalAmountForParticipantInInstance(instanceId, participantId);
        return ResponseEntity.ok(new ApiResponse<>(true, total));
    }
}