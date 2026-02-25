package com.example.study_flow_server.ai.repository;

import com.example.study_flow_server.ai.entity.AiHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiHistoryRepository extends JpaRepository<AiHistory, Long> {
    List<AiHistory> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
