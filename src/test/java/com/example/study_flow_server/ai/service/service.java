package com.example.study_flow_server.ai.service;

import com.example.study_flow_server.ai.dto.QuizSubmitRequest;
import com.example.study_flow_server.ai.entity.Quiz;
import com.example.study_flow_server.ai.entity.QuizResult;
import com.example.study_flow_server.ai.repository.QuizRepository;
import com.example.study_flow_server.ai.repository.QuizResultRepository;
import com.example.study_flow_server.user.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class QuizServiceTest {

    @InjectMocks
    private QuizService quizService;

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private QuizResultRepository quizResultRepository;

    @Test
    @DisplayName("퀴즈 정답 제출 - 정답인 경우")
    void submitAnswer_Correct() {
        Long quizId = 1L;
        String correctAnswer = "2";
        User user = User.builder().id(1L).username("testuser").build();
        QuizSubmitRequest request = new QuizSubmitRequest(quizId, correctAnswer);

        Quiz quiz = Quiz.builder()
                .id(quizId)
                .question("1+1은?")
                .answer(correctAnswer)
                .build();

        given(quizRepository.findById(quizId)).willReturn(Optional.of(quiz));

        boolean isCorrect = quizService.submitAnswer(user, request);

        assertThat(isCorrect).isTrue();

        verify(quizResultRepository).save(any(QuizResult.class));
    }

    @Test
    @DisplayName("퀴즈 정답 제출 - 오답인 경우")
    void submitAnswer_Wrong() {
        Long quizId = 1L;
        String correctAnswer = "2";
        String wrongAnswer = "3";
        User user = User.builder().id(1L).username("testuser").build();
        QuizSubmitRequest request = new QuizSubmitRequest(quizId, wrongAnswer);

        Quiz quiz = Quiz.builder()
                .id(quizId)
                .question("1+1은?")
                .answer(correctAnswer)
                .build();

        given(quizRepository.findById(quizId)).willReturn(Optional.of(quiz));

        boolean isCorrect = quizService.submitAnswer(user, request);

        assertThat(isCorrect).isFalse();

        verify(quizResultRepository).save(any(QuizResult.class));
    }
}
    