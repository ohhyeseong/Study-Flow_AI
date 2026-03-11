package com.example.study_flow_server.ai.service;

import com.example.study_flow_server.ai.dto.AiHistoryResponseDto;
import com.example.study_flow_server.ai.dto.AiResponseDto;
import com.example.study_flow_server.ai.entity.AiHistory;
import com.example.study_flow_server.ai.repository.AiHistoryRepository;
import com.example.study_flow_server.ai.repository.QuizResultRepository;
import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @InjectMocks
    private AiService aiService;

    @Mock
    private AiHistoryRepository aiHistoryRepository;

    @Mock
    private WebClient webClient;
    @Mock
    private AiDatabaseService aiDatabaseService;
    @Mock
    private QuizResultRepository quizResultRepository;

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private WebClient.RequestHeadersSpec requestHeadersSpec;

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private WebClient.ResponseSpec responseSpec;

    @BeforeEach
    void setUp() {
        // 필드로 선언된 Mock 객체들을 사용하여 WebClient의 체인 형태 호출을 Mocking한다.
        lenient().when(webClient.post()).thenReturn(requestBodyUriSpec);
        lenient().when(requestBodyUriSpec.uri(any(String.class))).thenReturn(requestBodyUriSpec);
        lenient().when(requestBodyUriSpec.contentType(any(MediaType.class))).thenReturn(requestBodyUriSpec);
        lenient().when(requestBodyUriSpec.body(any())).thenReturn(requestHeadersSpec);
        lenient().when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    }

    @Test
    @DisplayName("AI 기록 조회 - 성공")
    void getHistoryList_Success() {
        // given
        Long userId = 1L;
        User user = User.builder().id(userId).username("testuser").build();

        AiHistory history1 = AiHistory.builder()
                .id(10L)
                .user(user)
                .userPrompt("프롬프트1")
                .aiResponse("응답1")
                .imageUrl("image1.png")
                .build();
        history1.setCreatedAt(LocalDateTime.of(2023, 1, 1, 10, 0));

        AiHistory history2 = AiHistory.builder()
                .id(11L)
                .user(user)
                .userPrompt("프롬프트2")
                .aiResponse("응답2")
                .imageUrl("image2.png")
                .build();
        history2.setCreatedAt(LocalDateTime.of(2023, 1, 2, 10, 0));

        List<AiHistory> mockHistories = Arrays.asList(history1, history2);

        given(aiHistoryRepository.findAllByUserIdOrderByCreatedAtAsc(userId))
                .willReturn(mockHistories);

        // when
        List<AiHistoryResponseDto> result = aiService.getHistoryList(userId);

        // then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);

        assertThat(result.get(0).id()).isEqualTo(10L);
        assertThat(result.get(0).userPrompt()).isEqualTo("프롬프트1");

        assertThat(result.get(1).id()).isEqualTo(11L);
        assertThat(result.get(1).userPrompt()).isEqualTo("프롬프트2");

        verify(aiHistoryRepository).findAllByUserIdOrderByCreatedAtAsc(userId);
    }

    @Test
    @DisplayName("AI 기록 조회 - 결과 없음")
    void getHistoryList_NoResult() {
        // given
        Long userId = 2L;

        given(aiHistoryRepository.findAllByUserIdOrderByCreatedAtAsc(userId))
                .willReturn(List.of());

        // when
        List<AiHistoryResponseDto> result = aiService.getHistoryList(userId);

        // then
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();

        verify(aiHistoryRepository).findAllByUserIdOrderByCreatedAtAsc(userId);
    }

    @Test
    @DisplayName("이미지 분석 - 성공")
    void analyzeImage_Success() {
        // given
        User user = User.builder().id(1L).username("testuser").build();
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "test image".getBytes());
        String prompt = "이 이미지는 무엇인가요?";

        AiResponseDto mockResponse = new AiResponseDto("test.jpg", prompt, null, null, "테스트 응답", null, "Saved");

        given(responseSpec.bodyToMono(AiResponseDto.class)).willReturn(Mono.just(mockResponse));

        // when
        AiResponseDto result = aiService.analyzeImage(user, file, prompt);

        // then
        assertThat(result).isNotNull();
        assertThat(result.description()).isEqualTo("테스트 응답");

        verify(aiDatabaseService).saveAnalysisResult(user, prompt, mockResponse);
    }

    @Test
    @DisplayName("이미지 분석 - AI 서버 500 에러 발생 시")
    void analyzeImage_Fail_AiServerError() {
        // given
        User user = User.builder().id(1L).username("testuser").build();
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "test image".getBytes());
        String prompt = "이 이미지는 무엇인가요?";

        // responseSpec.bodyToMono(AiResponseDto.class)가 호출되면, WebClientResponseException을 던지도록 설정
        // 실제 에러처럼 상태 코드, 메시지, 빈 응답 본문을 가진 예외 객체를 생성하여 던진다.
        given(responseSpec.bodyToMono(AiResponseDto.class)).willThrow(
                new WebClientResponseException(
                        500, // 상태 코드
                        "Internal Server Error", // 상태 메시지
                        null, // 헤더 (null 가능)
                        new byte[0], // 응답 본문 (null이 아닌 빈 바이트 배열)
                        null  // 문자셋 (null 가능)
                )
        );

        // when & then
        // aiService.analyzeImage를 실행했을 때 CustomException이 발생하는지 검증
        CustomException exception = assertThrows(CustomException.class, () -> {
            aiService.analyzeImage(user, file, prompt);
        });

        // 발생한 예외의 ErrorCode가 AI_SERVER_ERROR인지 확인
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.AI_SERVER_ERROR);
    }
}