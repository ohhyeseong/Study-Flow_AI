package com.example.study_flow_server.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    PASSWORD_IS_INCORRECT(HttpStatus.BAD_REQUEST,"비밀번호가 틀렸습니다. 다시 입력해주세요"),

    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다.!"),

    FORBIDDEN(HttpStatus.FORBIDDEN, "사용자 권한이 없습니다."),

    INVALID_CODE(HttpStatus.UNAUTHORIZED, "이메일 인증 코드가 일치하지 않습니다."),

    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증 권한이 없습니다.(로그인을 진행해주세요)"),

    CONFLICT_USERNAME(HttpStatus.CONFLICT, "중복된 값이 있습니다."),

    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."),

    CHATROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."),

    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다."),

    ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "해당하는 방을 찾을 수 없습니다."),

    LANDMARK_NOT_FOUND(HttpStatus.NOT_FOUND, "랜드마크를 찾을 수 없습니다."),

    QUIZ_NOT_FOUND(HttpStatus.NOT_FOUND, "퀴즈를 찾을 수 없습니다."),

    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류입니다."),

    AI_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "AI 서버와 통신 중 오류가 발생했습니다."),
    IMAGE_PROCESSING_ERROR(HttpStatus.BAD_REQUEST, "이미지 처리 중 오류가 발생했습니다.");

    private final HttpStatus httpStatus;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String message){
        this.httpStatus = httpStatus;
        this.message = message;
    }
}
