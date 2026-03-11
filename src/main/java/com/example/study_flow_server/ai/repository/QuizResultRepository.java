package com.example.study_flow_server.ai.repository;

import com.example.study_flow_server.ai.entity.QuizResult;
import com.example.study_flow_server.ai.entity.SolveStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    // 특정 사용자의 기록 중 'WRONG(틀림)'인 데이터만 가져오기 (오답 노트의 핵심!)
    List<QuizResult> findAllByUserIdAndStatusOrderByCreatedAtDesc(Long userId, SolveStatus status);
}
