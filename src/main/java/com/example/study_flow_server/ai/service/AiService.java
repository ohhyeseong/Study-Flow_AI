package com.example.study_flow_server.ai.service;

import com.example.study_flow_server.ai.dto.AiHistoryResponseDto;
import com.example.study_flow_server.ai.dto.AiResponseDto;
import com.example.study_flow_server.ai.entity.AiHistory;
import com.example.study_flow_server.ai.repository.AiHistoryRepository;
import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiService {

    private final WebClient webClient;
    private final AiHistoryRepository aiHistoryRepository;

    @Transactional
    public Mono<AiResponseDto> analyzeImage(MultipartFile file, String prompt) {
        if (file.isEmpty()){
            return Mono.error(new CustomException(ErrorCode.IMAGE_PROCESSING_ERROR));
        }
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", file.getResource());
        builder.part("prompt",prompt);

        return webClient.post()
                .uri("/analyze-image")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> Mono.error(new CustomException(ErrorCode.AI_SERVER_ERROR)))
                .bodyToMono(AiResponseDto.class)
                .doOnNext(response -> { // 원래 flatMap이였는데 수정한 이유는
                    // flatMap은 데이터(string) -> flatMap(int로 변환해! -> 데이터(int) 이런느낌이였지만
                    // 현재 단순 대화 내용만 저장하는거기때문에 필요가 없기 때문에 doOnNext로 변환함.
                    AiHistory history = AiHistory.builder()
                            .userPrompt(prompt)
                            .aiResponse(response.aiResponse())
                            .imageUrl(response.filename())// 일단 파일명 저장 (나중에 S3 URL로 변경 가능)
                            .build();

                    // 비동기 환경에서 JPA 저장을 위해 blocking 호출 필요 (또는 R2DBC 사용 고려)
                    // 여기서는 간단하게 동기적으로 저장
                    aiHistoryRepository.save(history);

                });
    }

    public List<AiHistoryResponseDto> getHistoryList() {
        return aiHistoryRepository.findAll().stream()
                .map(AiHistoryResponseDto::from)
                .collect(Collectors.toList());
    }

}
