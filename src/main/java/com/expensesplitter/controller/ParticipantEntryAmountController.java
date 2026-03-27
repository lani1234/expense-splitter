package com.expensesplitter.controller;

import com.expensesplitter.dto.ParticipantEntryAmountResponse;
import com.expensesplitter.dto.ParticipantTotalsResponse;
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
    public ResponseEntity<ApiResponse<ParticipantEntryAmountResponse>> createParticipantEntryAmount(
            @RequestParam UUID fieldValueId,
            @RequestParam UUID participantId,
            @RequestParam BigDecimal amount) {
        ParticipantEntryAmountResponse participantEntryAmount = ParticipantEntryAmountResponse.from(
                participantEntryAmountService.createParticipantEntryAmount(fieldValueId, participantId, amount));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, participantEntryAmount, "ParticipantEntryAmount created successfully"));
    }

    @GetMapping("/{participantEntryAmountId}")
    public ResponseEntity<ApiResponse<ParticipantEntryAmountResponse>> getParticipantEntryAmount(@PathVariable UUID participantEntryAmountId) {
        ParticipantEntryAmountResponse participantEntryAmount = ParticipantEntryAmountResponse.from(
                participantEntryAmountService.getParticipantEntryAmountById(participantEntryAmountId));
        return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmount));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmountResponse>>> getAllParticipantEntryAmounts() {
        List<ParticipantEntryAmountResponse> participantEntryAmounts = participantEntryAmountService.getAllParticipantEntryAmounts()
                .stream().map(ParticipantEntryAmountResponse::from).toList();
        return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmounts));
    }

    @PutMapping("/{participantEntryAmountId}")
    public ResponseEntity<ApiResponse<ParticipantEntryAmountResponse>> updateParticipantEntryAmount(
            @PathVariable UUID participantEntryAmountId,
            @RequestParam BigDecimal amount) {
        ParticipantEntryAmountResponse participantEntryAmount = ParticipantEntryAmountResponse.from(
                participantEntryAmountService.updateParticipantEntryAmount(participantEntryAmountId, amount));
        return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmount, "ParticipantEntryAmount updated successfully"));
    }

    @DeleteMapping("/{participantEntryAmountId}")
    public ResponseEntity<ApiResponse<Void>> deleteParticipantEntryAmount(@PathVariable UUID participantEntryAmountId) {
        participantEntryAmountService.deleteParticipantEntryAmount(participantEntryAmountId);
        return ResponseEntity.ok(new ApiResponse<>(true, "ParticipantEntryAmount deleted successfully"));
    }

    // Query Endpoints
    @GetMapping("/field-value/{fieldValueId}")
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmountResponse>>> getParticipantEntryAmountsByFieldValue(
            @PathVariable UUID fieldValueId) {
        List<ParticipantEntryAmountResponse> participantEntryAmounts = participantEntryAmountService.getParticipantEntryAmountsByFieldValue(fieldValueId)
                .stream().map(ParticipantEntryAmountResponse::from).toList();
        return ResponseEntity.ok(new ApiResponse<>(true, participantEntryAmounts));
    }

    @GetMapping("/participant/{participantId}")
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmountResponse>>> getParticipantEntryAmountsByParticipant(
            @PathVariable UUID participantId) {
        List<ParticipantEntryAmountResponse> participantEntryAmounts = participantEntryAmountService.getParticipantEntryAmountsByParticipant(participantId)
                .stream().map(ParticipantEntryAmountResponse::from).toList();
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

    @GetMapping("/instance/{instanceId}/totals")
    public ResponseEntity<ApiResponse<ParticipantTotalsResponse>> getInstanceTotals(
            @PathVariable UUID instanceId) {
        ParticipantTotalsResponse totals = participantEntryAmountService.getInstanceTotals(instanceId);
        return ResponseEntity.ok(new ApiResponse<>(true, totals));
    }
}
