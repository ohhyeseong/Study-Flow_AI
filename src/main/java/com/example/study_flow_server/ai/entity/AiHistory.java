package com.example.study_flow_server.ai.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class AiHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userPrompt;

    @Column(columnDefinition = "TEXT")
    private String aiResponse;

    private String imageUrl;

    @CreatedDate
    private LocalDateTime createdAt;

    @Builder
    public AiHistory(String userPrompt, String aiResponse, String imageUrl) {
        this.userPrompt = userPrompt;
        this.aiResponse = aiResponse;
        this.imageUrl = imageUrl;
    }
}
