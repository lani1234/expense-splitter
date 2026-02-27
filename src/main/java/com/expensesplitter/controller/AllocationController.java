package com.expensesplitter.controller;

import com.expensesplitter.entity.ParticipantEntryAmount;
import com.expensesplitter.service.AllocationService;
import com.expensesplitter.service.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/allocations")
public class AllocationController {

    private final AllocationService allocationService;

    public AllocationController(AllocationService allocationService) {
        this.allocationService = allocationService;
    }

    // Allocation CRUD Operations
    @PostMapping
    public ResponseEntity<ApiResponse<ParticipantEntryAmount>> createAllocation(
            @RequestParam UUID fieldValueId,
            @RequestParam UUID participantId,
            @RequestParam BigDecimal amount) {
        try {
            ParticipantEntryAmount allocation = allocationService.createAllocation(fieldValueId, participantId, amount);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, allocation, "Allocation created successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error creating allocation: " + e.getMessage()));
        }
    }

    @GetMapping("/{allocationId}")
    public ResponseEntity<ApiResponse<ParticipantEntryAmount>> getAllocation(@PathVariable UUID allocationId) {
        try {
            ParticipantEntryAmount allocation = allocationService.getAllocationById(allocationId);
            return ResponseEntity.ok(new ApiResponse<>(true, allocation));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "Allocation not found: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmount>>> getAllAllocations() {
        try {
            List<ParticipantEntryAmount> allocations = allocationService.getAllAllocations();
            return ResponseEntity.ok(new ApiResponse<>(true, allocations));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching allocations: " + e.getMessage()));
        }
    }

    @PutMapping("/{allocationId}")
    public ResponseEntity<ApiResponse<ParticipantEntryAmount>> updateAllocation(
            @PathVariable UUID allocationId,
            @RequestParam BigDecimal amount) {
        try {
            ParticipantEntryAmount allocation = allocationService.updateAllocation(allocationId, amount);
            return ResponseEntity.ok(new ApiResponse<>(true, allocation, "Allocation updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error updating allocation: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{allocationId}")
    public ResponseEntity<ApiResponse<Void>> deleteAllocation(@PathVariable UUID allocationId) {
        try {
            allocationService.deleteAllocation(allocationId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Allocation deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting allocation: " + e.getMessage()));
        }
    }

    // Query Endpoints
    @GetMapping("/field-value/{fieldValueId}")
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmount>>> getAllocationsByFieldValue(
            @PathVariable UUID fieldValueId) {
        try {
            List<ParticipantEntryAmount> allocations = allocationService.getAllocationsByFieldValue(fieldValueId);
            return ResponseEntity.ok(new ApiResponse<>(true, allocations));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching allocations: " + e.getMessage()));
        }
    }

    @GetMapping("/participant/{participantId}")
    public ResponseEntity<ApiResponse<List<ParticipantEntryAmount>>> getAllocationsByParticipant(
            @PathVariable UUID participantId) {
        try {
            List<ParticipantEntryAmount> allocations = allocationService.getAllocationsByParticipant(participantId);
            return ResponseEntity.ok(new ApiResponse<>(true, allocations));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error fetching allocations: " + e.getMessage()));
        }
    }

    // Batch Operations
    @DeleteMapping("/field-value/{fieldValueId}")
    public ResponseEntity<ApiResponse<Void>> deleteAllocationsByFieldValue(@PathVariable UUID fieldValueId) {
        try {
            allocationService.deleteAllocationsByFieldValue(fieldValueId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Allocations deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting allocations: " + e.getMessage()));
        }
    }

    @DeleteMapping("/participant/{participantId}")
    public ResponseEntity<ApiResponse<Void>> deleteAllocationsByParticipant(@PathVariable UUID participantId) {
        try {
            allocationService.deleteAllocationsByParticipant(participantId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Allocations deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error deleting allocations: " + e.getMessage()));
        }
    }

    // Utility Endpoints
    @GetMapping("/instance/{instanceId}/participant/{participantId}/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalAllocationForParticipantInInstance(
            @PathVariable UUID instanceId,
            @PathVariable UUID participantId) {
        try {
            BigDecimal total = allocationService.getTotalAllocationForParticipantInInstance(instanceId, participantId);
            return ResponseEntity.ok(new ApiResponse<>(true, total));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error calculating total: " + e.getMessage()));
        }
    }
}