package com.example.study_flow_server.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChatCreateDto(
        @NotBlank(message = "내용은 필수 입력 값입니다.")
        @Size(max =30, message = "내용은 30글자 제한입니다.")
        String content,

        @NotNull(message = "채팅방 ID는 필수입니다.")
        Long roomId

) {
}
