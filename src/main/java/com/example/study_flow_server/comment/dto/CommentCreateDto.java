package com.example.study_flow_server.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentCreateDto(

        @NotBlank(message = "내용은 필수 입력 값입니다.")
        @Size(max =30, message = "내용은 30글자 제한입니다.")
        String content,

        Long parentId

) {
}