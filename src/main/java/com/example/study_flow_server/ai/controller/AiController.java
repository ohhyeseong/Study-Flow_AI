package com.example.study_flow_server.ai.controller;

import com.example.study_flow_server.ai.dto.AiHistoryResponseDto;
import com.example.study_flow_server.ai.dto.AiResponseDto;
import com.example.study_flow_server.ai.dto.QuizSubmitRequest;
import com.example.study_flow_server.ai.dto.WrongNoteResponse;
import com.example.study_flow_server.ai.entity.QuizResult;
import com.example.study_flow_server.ai.entity.SolveStatus;
import com.example.study_flow_server.ai.repository.QuizResultRepository;
import com.example.study_flow_server.ai.service.AiService;
import com.example.study_flow_server.ai.service.QuizService;
import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.global.security.CustomUserDetails;
import com.example.study_flow_server.user.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiService aiService;
    private final QuizService quizService;
    private final QuizResultRepository quizResultRepository;

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AiResponseDto analyzeImage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestPart("file") MultipartFile file,
            @RequestPart("prompt") String prompt
    ) {
        if (userDetails == null) {
            log.error("인증된 사용자 정보가 없습니다. (userDetails is null)");
            throw  new CustomException(ErrorCode.UNAUTHORIZED);
        }
        log.info("AI 분석 요청 - 사용자: {}, 파일: {}, 프롬프트: {}", userDetails.getUsername(), file.getOriginalFilename(), prompt);
        return aiService.analyzeImage(userDetails.getUser(), file, prompt);
    }

    @GetMapping("/history")
    public List<AiHistoryResponseDto> getHistoryList(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        return aiService.getHistoryList(userDetails.getUser().getId());
    }

    @PostMapping("/quiz/submit")
    public ResponseEntity<List<AiHistoryResponseDto>> submitAnswer(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody QuizSubmitRequest request
    ) {
        if (userDetails == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        User user = userDetails.getUser();

        quizService.submitAnswer(userDetails.getUser(), request);
        List<AiHistoryResponseDto> historyList = aiService.getHistoryList(user.getId());
        return ResponseEntity.ok(historyList);
    }

    @GetMapping("/notes/wrong")
    public ResponseEntity<List<WrongNoteResponse>> getWrongNotes(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        User user = userDetails.getUser();

        List<QuizResult> results = quizResultRepository
                .findAllByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), SolveStatus.WRONG);

        List<WrongNoteResponse> responses = results.stream()
                .map(WrongNoteResponse::from)
                .toList();

        return ResponseEntity.ok(responses);
    }
}
