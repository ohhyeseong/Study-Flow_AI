package com.example.study_flow_server.ai.repository;

import com.example.study_flow_server.ai.entity.AiHistory;
import com.example.study_flow_server.ai.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    // 특정 AiHistory와 연결된 퀴즈를 찾을 때 사용
    Optional<Quiz> findByAiHistory(AiHistory aiHistory);
}
