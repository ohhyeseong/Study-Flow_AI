package com.example.study_flow_server.chat.dto;

import com.example.study_flow_server.chat.domain.ChatRoom;

public record ChatRoomDto(
        Long id,
        String title,
        String creatorName
) {
    public static ChatRoomDto from(ChatRoom chatRoom) {
        return new ChatRoomDto(
                chatRoom.getId(),
                chatRoom.getTitle(),
                chatRoom.getCreator().getUsername()
        );
    }
}