package com.example.study_flow_server.ai.repository;

import com.example.study_flow_server.ai.entity.AiHistory;
import com.example.study_flow_server.ai.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    Optional<Quiz> findByAiHistory(AiHistory aiHistory);
}
