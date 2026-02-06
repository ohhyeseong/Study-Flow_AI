package com.example.study_flow_server.global.exception;

import lombok.Getter;

@Getter
public class CustomException extends RuntimeException{

    private final ErrorCode errorCode;

    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMassage());
        this.errorCode = errorCode;
    }
}
