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


    @Transactional // 분석 메서드
    public Mono<AiResponseDto> analyzeImage(User user, MultipartFile file, String prompt) {
        log.info(">>>> [1] analyzeImage 서비스 진입 성공! 유저: {}, 프롬프트: {}", user.getUsername(), prompt);
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        if (file != null && !file.isEmpty()) {
            builder.part("file", file.getResource()).filename(file.getOriginalFilename());
        }
        builder.part("prompt", prompt);

        return webClient.post()
                .uri("/analyze-image")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(String.class) // 일단 String으로 원본을 받아서 찍어봅시다
                .flatMap(rawJson -> {
                    log.info(">>>> [2] AI 서버로부터 받은 원본 JSON: {}", rawJson);

                    try {
                        // 원본 JSON을 객체로 변환
                        AiResponseDto response = objectMapper.readValue(rawJson, AiResponseDto.class);
                        log.info(">>>> [3] JSON 변환 성공! 파일명: {}", response.filename());

                        aiDatabaseService.saveAnalysisResult(user, prompt, response);
                        return Mono.just(response);
                    } catch (Exception e) {
                        log.error(">>>> [ERROR] JSON 파싱 또는 DB 저장 중 사고 발생: {}", e.getMessage());
                        return Mono.error(e);
                    }
                })
                .publishOn(Schedulers.boundedElastic());
    }

    public List<AiHistoryResponseDto> getHistoryList(Long userId) {
        return aiHistoryRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(AiHistoryResponseDto::from)
                .collect(Collectors.toList());
    }
}
