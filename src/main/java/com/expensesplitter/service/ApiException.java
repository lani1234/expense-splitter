package com.expensesplitter.service;

public class ApiException extends RuntimeException {
    private final String errorCode;
    private final int httpStatus;

    public ApiException(String message, String errorCode, int httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public int getHttpStatus() {
        return httpStatus;
    }
}