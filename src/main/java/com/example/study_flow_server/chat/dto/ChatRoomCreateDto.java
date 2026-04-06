package com.example.study_flow_server.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRoomCreateDto(
        @NotBlank(message = "필수 입력란입니다!")
        @Size(min = 0,max = 12,message = "0 ~ 12자 이내로 작성해주세요!")
        String title,
        boolean isPrivate
) {
}
