package com.example.study_flow_server.ai.entity;

import com.example.study_flow_server.global.entity.BaseEntity;
import com.example.study_flow_server.user.domain.User;
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
public class AiHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userPrompt;

    @Column(columnDefinition = "TEXT")
    private String aiResponse;

    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Builder
    public AiHistory(String userPrompt, String aiResponse, String imageUrl,User user) {
        this.userPrompt = userPrompt;
        this.aiResponse = aiResponse;
        this.imageUrl = imageUrl;
        this.user = user;
    }
}
