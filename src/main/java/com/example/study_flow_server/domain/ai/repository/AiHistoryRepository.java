package com.example.study_flow_server.domain.ai.repository;

import com.example.study_flow_server.domain.ai.entity.AiHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiHistoryRepository extends JpaRepository<AiHistory, Long> {
}
