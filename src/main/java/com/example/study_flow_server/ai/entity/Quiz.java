package com.example.study_flow_server.ai.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_history_id")
    private AiHistory aiHistory;

    @Column(nullable = false)
    private String question;

    @ElementCollection
    @CollectionTable(name = "quiz_options", joinColumns = @JoinColumn(name = "quiz_id"))
    @Column(name = "option_text")
    private List<String> options;

    @Column(nullable = false)
    private String answer;

    @Builder
    public Quiz(Long id,AiHistory aiHistory, String question, List<String> options, String answer) {
        this.id = id;
        this.aiHistory = aiHistory;
        this.question = question;
        this.options = options;
        this.answer = answer;
    }
}
