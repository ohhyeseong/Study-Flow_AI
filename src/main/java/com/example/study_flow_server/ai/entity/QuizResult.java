package com.example.study_flow_server.ai.entity;

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
public class QuizResult extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    @Column(nullable = false)
    private String userAnswer; // 사용자가 제출한 답

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SolveStatus status; // CORRECT 또는 WRONG

    @Builder
    public QuizResult(User user, Quiz quiz, String userAnswer, SolveStatus status){
        this.user = user;
        this.quiz = quiz;
        this.userAnswer = userAnswer;
        this.status = status;
    }
}
