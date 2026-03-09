package com.example.study_flow_server.ai.service;

import com.example.study_flow_server.ai.dto.AiHistoryResponseDto;
import com.example.study_flow_server.ai.dto.AiQuizDto;
import com.example.study_flow_server.ai.dto.AiResponseDto;
import com.example.study_flow_server.ai.entity.AiHistory;
import com.example.study_flow_server.ai.entity.Quiz;
import com.example.study_flow_server.ai.repository.AiHistoryRepository;
import com.example.study_flow_server.ai.repository.QuizRepository;
import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.user.domain.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiService {

    private final WebClient webClient;
    private final AiHistoryRepository aiHistoryRepository;
    private final QuizRepository quizRepository;
    private final AiDatabaseService aiDatabaseService;

    @Transactional
    public AiResponseDto analyzeImage(User user, MultipartFile file, String prompt) {
        log.info(">>>> [1] analyzeImage 서비스 진입 성공! 유저: {}, 프롬프트: {}", user.getUsername(), prompt);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        if (file != null && !file.isEmpty()) {
            builder.part("file", file.getResource()).filename(file.getOriginalFilename());
        }
        builder.part("prompt", prompt);

        try {
            // 1. WebClient 요청 후 결과를 block()으로 기다림
            AiResponseDto response = webClient.post()
                    .uri("/api/v1/analyze-image")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    //String 대신 AiResponseDto.class를 지정하여 자동 변환을 지시한다.
                    .bodyToMono(AiResponseDto.class)
                    //응답이 올 때까지 대기하고, 만약 응답이 비어있으면 예외를 발생시킨다.
                    .blockOptional()
                    .orElseThrow(() -> new CustomException(ErrorCode.AI_SERVER_ERROR));

            log.info(">>>> [2] AI 서버로부터 받은 원본 JSON: {}", response);

            // 2. DB 저장 (Transactional 내에서 실행)
            aiDatabaseService.saveAnalysisResult(user, prompt, response);

            return response;
        } catch (Exception e) {// WebClient 에러 또는 DB 저장 에러를 여기서 잡는다.
            log.error(">>>> [ERROR] AI 서버 통신 또는 DB 저장 중 사고 발생: {}", e.getMessage());
            //  추후 WebClient 관련 예외를 따로 분리하여 더 상세한 에러 처리가 가능하다.
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public List<AiHistoryResponseDto> getHistoryList(Long userId) {
        return aiHistoryRepository.findAllByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(AiHistoryResponseDto::from)
                .collect(Collectors.toList());
    }
}
