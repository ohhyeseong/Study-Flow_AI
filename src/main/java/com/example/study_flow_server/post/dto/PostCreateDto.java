package com.example.study_flow_server.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PostCreateDto(

        @NotBlank(message = "제목은 필수 입력 값입니다.")
        @Size(max = 30, message = "제목은 30글자 제한 입니다.")
        String title,

        @NotBlank(message = "내용은 필수 입력 값입니다.")
        String content,

        List<String> imageUrls

) {
}