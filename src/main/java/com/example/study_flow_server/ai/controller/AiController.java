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
import com.example.study_flow_server.global.response.ApiResponse;
import com.example.study_flow_server.global.security.CustomUserDetails;
import com.example.study_flow_server.user.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiService aiService;
    private final QuizService quizService;

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AiResponseDto> analyzeImage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart("prompt") String prompt
    ) {
        log.info("AI 분석 요청 - 사용자: {}, 파일: {}, 프롬포트: {}", userDetails.getUsername(), file.getOriginalFilename(), prompt);
        AiResponseDto responseDto = aiService.analyzeImage(userDetails.getUser(), file, prompt);
        return ApiResponse.ok(responseDto);
    }

    @GetMapping("/history")
    public ApiResponse<List<AiHistoryResponseDto>> getHistoryList(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<AiHistoryResponseDto> historyList = aiService.getHistoryList(userDetails.getUser().getId());
        return ApiResponse.ok(historyList);
    }

    @PostMapping("/quiz/submit")
    public ApiResponse<List<AiHistoryResponseDto>> submitAnswer(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody QuizSubmitRequest request
    ) {
        User user = userDetails.getUser();

        quizService.submitAnswer(userDetails.getUser(), request);
        List<AiHistoryResponseDto> historyList = aiService.getHistoryList(user.getId());
        return ApiResponse.ok(historyList);
    }

    @GetMapping("/notes/wrong")
    public ApiResponse<List<WrongNoteResponse>> getWrongNotes(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<WrongNoteResponse> wrongNotes = aiService.getWrongNotes(userDetails.getUser().getId());
        return ApiResponse.ok(wrongNotes);
    }

    @DeleteMapping("/notes/wrong/{quizId}")
    public ApiResponse<Void> deleteWrongNote(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long quizId
    ) {
        Long userId = userDetails.getUser().getId();
        aiService.deleteWrongNote(userId, quizId);

        return ApiResponse.ok(null);
    }
}
