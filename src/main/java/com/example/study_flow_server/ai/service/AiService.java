package com.example.study_flow_server.ai.service;

import com.example.study_flow_server.ai.dto.AiHistoryResponseDto;
import com.example.study_flow_server.ai.dto.AiResponseDto;
import com.example.study_flow_server.ai.dto.WrongNoteResponse;
import com.example.study_flow_server.ai.entity.SolveStatus;
import com.example.study_flow_server.ai.repository.AiHistoryRepository;
import com.example.study_flow_server.ai.repository.QuizResultRepository;
import com.example.study_flow_server.user.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StopWatch;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiService {

    private final WebClient webClient;
    private final AiHistoryRepository aiHistoryRepository;
    private final AiDatabaseService aiDatabaseService;
    private final QuizResultRepository quizResultRepository;

    // 💡 수정: 파일이 null일 때 Redis 키 생성 시 에러가 나지 않도록 조건부 처리
    @Transactional
    @Cacheable(value = "aiAnalysis", key = "#prompt + (#file != null ? #file.getOriginalFilename() : 'no_file')")
    public AiResponseDto analyzeImage(User user, MultipartFile file, String prompt) {
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();

        // 💡 수정: 로깅 시 null 체크
        String fileName = (file != null && !file.isEmpty()) ? file.getOriginalFilename() : "첨부파일 없음";
        log.info(">>> AI 서버 호출 시작: {}", fileName);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("prompt", prompt); // 프롬프트는 항상 보냄

        // 💡 수정: 파일이 실제로 존재할 때만 파트 추가
        if (file != null && !file.isEmpty()) {
            try {
                builder.part("file", new ByteArrayResource(file.getBytes()))
                        .filename(file.getOriginalFilename())
                        .contentType(MediaType.parseMediaType(file.getContentType()));
            } catch (IOException e) {
                throw new RuntimeException("파일 처리 중 오류가 발생했습니다.", e);
            }
        }

        AiResponseDto responseDto = webClient.post()
                .uri("/api/v1/analyze-image")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(AiResponseDto.class)
                .block();

        stopWatch.stop();
        double totalTime = stopWatch.getTotalTimeSeconds();

        System.out.println("======= PERFORMANCE METRIC =======");
        System.out.println("AI Analysis Time: " + totalTime + "s");
        System.out.println("==================================");

        if (responseDto != null) {
            responseDto = responseDto.withResponseTime(totalTime);
            aiDatabaseService.saveAnalysisResult(user, prompt, responseDto);
        }

        return responseDto;
    }

    public List<AiHistoryResponseDto> getHistoryList(Long userId) {
        return aiHistoryRepository.findAllByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(AiHistoryResponseDto::from)
                .collect(Collectors.toList());
    }

    public List<WrongNoteResponse> getWrongNotes(Long userId) {
        return quizResultRepository
                .findAllByUserIdAndStatusOrderByCreatedAtDesc(userId, SolveStatus.WRONG)
                .stream()
                .map(WrongNoteResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteWrongNote(Long userId, Long quizId) {
        quizResultRepository.deleteByUserIdAndQuizId(userId, quizId);
    }
}