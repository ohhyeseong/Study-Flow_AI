package com.example.study_flow_server.chat.domain;

import com.example.study_flow_server.global.entity.BaseEntity;
import com.example.study_flow_server.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "chat_rooms")
public class ChatRoom extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private boolean isPrivate = false;

    @Column
    private String roomCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;

    @Builder
    public ChatRoom(String title, User creator, boolean isPrivate, String roomCode) {
        this.title = title;
        this.creator = creator;
        this.isPrivate = isPrivate;
        this.roomCode = roomCode;
    }
}