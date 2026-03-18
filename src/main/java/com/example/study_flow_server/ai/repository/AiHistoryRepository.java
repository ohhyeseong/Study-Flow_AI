package com.example.study_flow_server.ai.repository;

import com.example.study_flow_server.ai.entity.AiHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AiHistoryRepository extends JpaRepository<AiHistory, Long> {
    
    @Query("SELECT DISTINCT ah FROM AiHistory ah " +
           "JOIN FETCH ah.user u " +
           "LEFT JOIN FETCH ah.quiz q " +
           "WHERE u.id = :userId " +
           "ORDER BY ah.createdAt ASC")
    List<AiHistory> findAllByUserIdOrderByCreatedAtAsc(@Param("userId") Long userId);
}
