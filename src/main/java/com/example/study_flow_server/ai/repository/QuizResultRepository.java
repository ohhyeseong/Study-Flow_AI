package com.example.study_flow_server.ai.repository;

import com.example.study_flow_server.ai.entity.QuizResult;
import com.example.study_flow_server.ai.entity.SolveStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    List<QuizResult> findAllByUserIdAndStatusOrderByCreatedAtDesc(Long userId, SolveStatus status);

    void deleteByUserIdAndQuizId(Long userId, Long quizId);
}
