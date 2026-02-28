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


    @Transactional
    public Mono<AiResponseDto> analyzeImage(User user, MultipartFile file, String prompt) {
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
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("AI 서버 에러 발생: {}", errorBody);
                                    return Mono.error(new CustomException(ErrorCode.AI_SERVER_ERROR));
                                }))
                .bodyToMono(AiResponseDto.class)
                .flatMap(response -> {
                    log.info(">>> AI 서버로부터 응답 수신 완료. DB 저장 시작...");
                    return Mono.fromCallable(() -> {
                        String fullResponse = response.aiResponse();
                        String description = fullResponse;
                        String quizJson = "";

                        if (fullResponse != null && fullResponse.contains("###QUIZ###")) {
                            log.info(">>> 퀴즈 태그 발견. 파싱 시작...");
                            String[] parts = fullResponse.split("###QUIZ###");
                            description = parts.length > 0 ? parts[0].trim() : "";
                            quizJson = parts.length > 1 ? parts[1].trim() : "";
                        } else {
                            log.warn(">>> 퀴즈 태그를 찾을 수 없습니다.");
                        }

                        log.info(">>> AiHistory 저장을 시도합니다...");
                        AiHistory history = AiHistory.builder()
                                .user(user)
                                .userPrompt(prompt)
                                .aiResponse(description) // 설명 부분만 저장
                                .imageUrl(response.filename())
                                .build();
                        AiHistory savedHistory = aiHistoryRepository.save(history);
                        log.info(">>> AiHistory 저장 성공. ID: {}", savedHistory.getId());

                        if (!quizJson.isEmpty()) {
                            log.info(">>> 퀴즈 저장을 시도합니다. JSON: {}", quizJson);
                            try {
                                AiQuizDto quizDto = objectMapper.readValue(quizJson, AiQuizDto.class);
                                Quiz quiz = Quiz.builder()
                                        .aiHistory(savedHistory)
                                        .question(quizDto.question())
                                        .options(quizDto.options())
                                        .answer(quizDto.answer())
                                        .build();
                                quizRepository.save(quiz);

                                log.info(">>> Quiz 저장 성공. AiHistory ID: {}", savedHistory.getId());
                            } catch (Exception e) {
                                log.error("!!! Quiz JSON 파싱 또는 저장 중 에러 발생: {}", e.getMessage(), e);
                            }
                        }
                        log.info(">>> DB 저장 프로세스 완료.");
                        return response;
                    }).subscribeOn(Schedulers.boundedElastic());
                });
    }

    public List<AiHistoryResponseDto> getHistoryList(Long userId) {
        return aiHistoryRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(AiHistoryResponseDto::from)
                .collect(Collectors.toList());
    }
}
