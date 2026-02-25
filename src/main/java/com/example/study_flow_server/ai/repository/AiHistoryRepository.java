package com.example.study_flow_server.ai.repository;

import com.example.study_flow_server.ai.entity.AiHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiHistoryRepository extends JpaRepository<AiHistory, Long> {
}
