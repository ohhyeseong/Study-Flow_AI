package com.example.study_flow_server.chat.dto;

import com.example.study_flow_server.chat.domain.ChatMessage;

import java.time.LocalDateTime;

public record ChatResponseDto(

        Long id,
        String content,
        String senderName,
        String senderProfileImageUrl,
        Long roomId,
        LocalDateTime createdAt
) {
    public static ChatResponseDto from(ChatMessage message) {
        return new ChatResponseDto(
                message.getId(),
                message.getContent(),
                message.getSender() != null ? message.getSender().getUsername() : "알 수 없음",
                message.getSender() != null ? message.getSender().getProfileImageUrl() : null,
                message.getChatRoom().getId(),
                message.getCreatedAt()
        );
    }
}