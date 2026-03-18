package com.example.study_flow_server.ai.service;

import com.example.study_flow_server.ai.dto.AiHistoryResponseDto;
import com.example.study_flow_server.ai.dto.AiResponseDto;
import com.example.study_flow_server.ai.dto.WrongNoteResponse;
import com.example.study_flow_server.ai.entity.SolveStatus;
import com.example.study_flow_server.ai.repository.AiHistoryRepository;
import com.example.study_flow_server.ai.repository.QuizResultRepository;
import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.user.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

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

    @Transactional
    public AiResponseDto analyzeImage(User user, MultipartFile file, String prompt) {

        MultipartBodyBuilder builder = createMultipartBody(file, prompt);

        try {
            AiResponseDto response = requestAnalysisToAiServer(builder);

            aiDatabaseService.saveAnalysisResult(user, prompt, response);

            return response;
        } catch (CustomException e) {
            throw e;
        } catch (WebClientResponseException e) {
            throw new CustomException(ErrorCode.AI_SERVER_ERROR);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
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

    private MultipartBodyBuilder createMultipartBody(MultipartFile file, String prompt) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        if (file != null && !file.isEmpty()) {
            builder.part("file", file.getResource()).filename(file.getOriginalFilename());
        }
        builder.part("prompt", prompt);
        return builder;
    }

    private AiResponseDto requestAnalysisToAiServer(MultipartBodyBuilder builder) {
        return webClient.post()
                .uri("/api/v1/analyze-image")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(AiResponseDto.class)
                .blockOptional()
                .orElseThrow(() -> new CustomException(ErrorCode.AI_SERVER_ERROR));
    }
}
