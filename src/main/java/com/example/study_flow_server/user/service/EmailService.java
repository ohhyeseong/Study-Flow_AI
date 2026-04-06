package com.example.study_flow_server.user.service;

import com.example.study_flow_server.redis.RedisService;
import lombok.RequiredArgsConstructor;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final RedisService redisService;

    private static final Duration VERIFICATION_CODE_EXPIRATION = Duration.ofMinutes(5);
    private static final Duration SIGNUP_TICKET_EXPIRATION = Duration.ofHours(10);
    private static final String REDIS_AUTH_PREFIX = "AUTH:";
    private static final String REDIS_DONE_PREFIX = "DONE:";

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendVerificationCode(String targetEmail) {
        String verificationCode = generateSixDigitCode();
        String redisKey = REDIS_AUTH_PREFIX + targetEmail;

        redisService.setValues(redisKey, verificationCode, VERIFICATION_CODE_EXPIRATION);

        SimpleMailMessage mailMessage = createVerificationMailMessage(targetEmail, verificationCode);
        mailSender.send(mailMessage);
    }

    public boolean verifyCode(String email, String userProvidedCode) {
        String redisKey = REDIS_AUTH_PREFIX + email;
        String storedVerificationCode = redisService.getValues(redisKey);

        if (isVerificationSuccessful(storedVerificationCode, userProvidedCode)) {
            redisService.deleteValues(redisKey);
            grantSignupTicket(email);
            return true;
        }
        return false;
    }

    private String generateSixDigitCode() {
        int code = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return String.valueOf(code);
    }

    private SimpleMailMessage createVerificationMailMessage(String targetEmail, String verificationCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(targetEmail);
        message.setSubject("인증번호 확인");
        message.setText("인증번호는 [" + verificationCode + "] 입니다.");
        return message;
    }

    public void sendStudyInvite(String targetEmail, Long roomId, String roomTitle, String roomCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(targetEmail);
        message.setSubject("[Study-Flow] '" + roomTitle + "' 스터디방 초대장");
        message.setText("안녕하세요! Study-Flow 스터디에 초대되셨습니다.\n\n" +
                "📍 방 번호: " + roomId + "번\n" +
                "📍 방 제목: " + roomTitle + "\n" +
                "🔑 입장 코드: [" + roomCode + "]\n\n" +
                "아래 링크를 클릭하여 Study-Flow에 접속한 뒤, 채팅 탭에서 원하시는 방을 클릭 후 코드를 입력해 참가하세요!\n" +
                "👉 접속 링크: http://localhost:3000/chat");
        mailSender.send(message);
    }

    private boolean isVerificationSuccessful(String storedCode, String providedCode) {
        return storedCode != null && storedCode.equals(providedCode);
    }

    private void grantSignupTicket(String email) {
        redisService.setValues(REDIS_DONE_PREFIX + email, "true", SIGNUP_TICKET_EXPIRATION);
    }
}