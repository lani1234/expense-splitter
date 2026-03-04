package com.expensesplitter.service;

public class ValidationException extends ApiException {
    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR", 400);
    }
}