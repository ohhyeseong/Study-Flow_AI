package com.example.study_flow_server.ai.entity;

import com.example.study_flow_server.ai.dto.AiQuizDto;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

import java.util.ArrayList;
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
    @BatchSize(size = 100)
    @CollectionTable(name = "quiz_options", joinColumns = @JoinColumn(name = "quiz_id"))
    @Column(name = "option_text")
    private List<String> options = new ArrayList<>();

    @Column(nullable = false)
    private String answer;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    public AiQuizDto toAiQuizDto() {
        return new AiQuizDto(
                this.id,
                this.question,
                new ArrayList<>(this.options),
                this.answer,
                this.explanation
        );
    }

    @Builder
    public Quiz(Long id, AiHistory aiHistory, String question, List<String> options, String answer, String explanation) {
        this.id = id;
        this.aiHistory = aiHistory;
        this.question = question;
        this.options = options;
        this.answer = answer;
        this.explanation = explanation;
    }
}
