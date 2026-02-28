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
        if (file.isEmpty()){
            return Mono.error(new CustomException(ErrorCode.IMAGE_PROCESSING_ERROR));
        }

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", file.getResource())
                .filename(file.getOriginalFilename()); // 파일 이름 명시
        builder.part("prompt", prompt);

        return webClient.post()
                .uri("/analyze-image")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> Mono.error(new CustomException(ErrorCode.AI_SERVER_ERROR)))
                .bodyToMono(AiResponseDto.class)
                .flatMap(response -> {
                    // JPA 호출은 블로킹이므로 별도의 스레드에서 실행하도록 함
                    return Mono.fromCallable(() -> {
                        // 1. AI 응답 원문 가져오기
                        String fullResponse = response.aiResponse();
                        String description = fullResponse;
                        String quizJson = "";

                        // 2. 파싱 로직: ###QUIZ### 태그를 기준으로 나눔
                        if (fullResponse.contains("###QUIZ###")) {
                            String[] parts = fullResponse.split("###QUIZ###");
                            description = parts[0].trim(); // AI의 설명 부분
                            if (parts.length > 1) {
                                quizJson = parts[1].trim(); // JSON 데이터 부분
                            }
                        }

                        // 3. AiHistory 저장 (설명 텍스트만 저장)
                        AiHistory history = AiHistory.builder()
                                .user(user)
                                .userPrompt(prompt)
                                .aiResponse(description)
                                .imageUrl(response.filename())
                                .build();
                        AiHistory savedHistory = aiHistoryRepository.save(history);

                        // 4. 퀴즈가 있다면 Quiz 테이블에 저장
                        if (!quizJson.isEmpty()) {
                            try {
                                // 아까 만든 AiQuizDto record 사용
                                AiQuizDto quizDto = objectMapper.readValue(quizJson, AiQuizDto.class);

                                Quiz quiz = Quiz.builder()
                                        .aiHistory(savedHistory)
                                        .question(quizDto.question())
                                        .options(quizDto.options())
                                        .answer(quizDto.answer())
                                        .build();
                                quizRepository.save(quiz);
                            } catch (Exception e) {
                                // 퀴즈 파싱에 실패하더라도 전체 흐름이 깨지지 않게 로그만 남김
                                log.error("Quiz JSON 파싱 에러: {}", e.getMessage());
                            }
                        }
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
