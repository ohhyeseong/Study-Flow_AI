package com.example.study_flow_server.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다.!"),

    // 403
    FORBIDDEN(HttpStatus.FORBIDDEN, "사용자 권한이 없습니다."),

    //401
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증 권한이 없습니다.(로그인을 진행해주세요)"),

    // 409
    CONFLICT_USERNAME(HttpStatus.CONFLICT, "중복된 값이 있습니다."),

    // 404
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."),

    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다."),

    ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "해당하는 방을 찾을 수 없습니다."),

    // 500
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류입니다."),;

    private final HttpStatus httpStatus;
    private final String massage;

    ErrorCode(HttpStatus httpStatus, String massage){
        this.httpStatus = httpStatus;
        this.massage = massage;
    }
}
