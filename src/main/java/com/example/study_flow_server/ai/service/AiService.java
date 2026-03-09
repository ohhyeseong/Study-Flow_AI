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
    private final ObjectMapper objectMapper;
    private final AiDatabaseService aiDatabaseService;

    @Transactional
    public AiResponseDto analyzeImage(User user, MultipartFile file, String prompt) {
        log.info(">>>> [1] analyzeImage 서비스 진입 성공! 유저: {}, 프롬프트: {}", user.getUsername(), prompt);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        if (file != null && !file.isEmpty()) {
            builder.part("file", file.getResource()).filename(file.getOriginalFilename());
        }
        builder.part("prompt", prompt);

        // 1. WebClient 요청 후 결과를 block()으로 기다림
        String rawJson = webClient.post()
                .uri("/api/v1/analyze-image")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(String.class)
                .block(); // 🟢 여기서 비동기 응답이 올 때까지 대기합니다.

        log.info(">>>> [2] AI 서버로부터 받은 원본 JSON: {}", rawJson);

        try {
            // 2. JSON 파싱
            AiResponseDto response = objectMapper.readValue(rawJson, AiResponseDto.class);
            log.info(">>>> [3] JSON 변환 성공! 파일명: {}", response.filename());

            // 3. DB 저장 (Transactional 내에서 실행)
            aiDatabaseService.saveAnalysisResult(user, prompt, response);

            return response;
        } catch (Exception e) {
            log.error(">>>> [ERROR] JSON 파싱 또는 DB 저장 중 사고 발생: {}", e.getMessage());
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public List<AiHistoryResponseDto> getHistoryList(Long userId) {
        return aiHistoryRepository.findAllByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(AiHistoryResponseDto::from)
                .collect(Collectors.toList());
    }
}
