package com.example.study_flow_server.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChatCreateDto(
        @NotBlank(message = "내용은 필수 입력 값입니다.")
        @Size(min = 0,max = 1000, message = "메시지가 너무 깁니다. 0 ~ 1000자 이내로 작성해주세요")
        String content,

        @NotNull(message = "채팅방 ID는 필수입니다.")
        Long roomId

) {
}
