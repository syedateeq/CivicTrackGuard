package com.ateeq.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ChatbotService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // System persona injected before every user message
    private static final String SYSTEM_PROMPT = """
            You are CivicBot, a friendly and helpful AI assistant built into CivicTrackGuard —
            a civic issue reporting and tracking platform for citizens and municipal officers.

            Your job is to help users with:
            1. How to report a civic issue (road damage, garbage, water leakage, streetlights, electricity faults, etc.)
            2. What issue statuses mean:
               - PENDING: Issue submitted, awaiting admin review.
               - VERIFIED: Admin confirmed the issue is valid. Reporter gets +10 points.
               - IN_PROGRESS: Assigned to a department and being worked on.
               - RESOLVED: Issue has been fixed. Reporter gets +20 points.
               - REJECTED: Issue was invalid or a duplicate. Reporter loses 5 points.
            3. How the points and leaderboard work:
               - Report an issue: +5 points
               - Issue gets verified: +10 points
               - Issue gets resolved: +20 points
               - Someone upvotes your issue: +2 points
               - Issue rejected: -5 points
            4. How to use the dashboard, issue feed, map, and notifications.
            5. General guidance about civic issues and how to write good reports.
            6. Platform navigation help.

            Tone: Helpful, concise, warm and professional. Use short paragraphs.
            Keep responses under 200 words unless a detailed explanation is truly needed.
            If someone asks something completely unrelated to the platform or civic issues, politely
            redirect them back to platform-related topics.
            Do NOT make up or hallucinate any data about specific issues or users.
            """;

    public ChatbotService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("--- Gemini Configuration ---");
        log.info("Gemini API URL: {}", apiUrl);
        if (apiUrl != null && apiUrl.contains("models/")) {
            String model = apiUrl.substring(apiUrl.indexOf("models/"));
            model = model.split(":")[0];
            log.info("Selected model: {}", model);
        }
        log.info("API Key loaded: {}", (apiKey != null && !apiKey.trim().isEmpty() && apiKey.length() > 10) ? "YES (starts with " + apiKey.substring(0, 8) + "...)" : "NO / INVALID");
        log.info("----------------------------");
    }

    public String ask(String userMessage) {
        try {
            String fullPrompt = SYSTEM_PROMPT + "\n\nUser: " + userMessage + "\n\nCivicBot:";
            return callGemini(fullPrompt);
        } catch (Exception e) {
            log.error("ChatbotService - Gemini call failed: {}", e.getMessage());
            return "I'm having trouble connecting right now. Please try again in a moment, or visit our Help section for guidance.";
        }
    }

    private String callGemini(String prompt) throws Exception {
        String url = apiUrl + "?key=" + apiKey;

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        return root
                .path("candidates").get(0)
                .path("content")
                .path("parts").get(0)
                .path("text").asText("Sorry, I could not generate a response.");
    }
}
