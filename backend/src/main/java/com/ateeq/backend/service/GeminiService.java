package com.ateeq.backend.service;

import com.ateeq.backend.dto.AiAnalysisRequest;
import com.ateeq.backend.dto.AiAnalysisResponse;
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
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }

    public AiAnalysisResponse analyzeIssue(AiAnalysisRequest request) {
        try {
            String prompt = buildPrompt(request);
            String geminiResponse = callGeminiApi(prompt);
            return parseGeminiResponse(geminiResponse);
        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            // Return a fallback heuristic response
            return buildFallbackResponse(request);
        }
    }

    private String buildPrompt(AiAnalysisRequest request) {
        return String.format("""
            You are an AI assistant for a civic issue reporting platform called CivicTrackGuard.
            Analyze the following civic issue report and respond ONLY with valid JSON, no markdown, no extra text.
            
            Issue Title: %s
            Description: %s
            Location: %s
            
            Respond with this exact JSON structure:
            {
              "category": "ROAD_DAMAGE | GARBAGE | WATER_LEAKAGE | STREETLIGHT | ELECTRICITY | OTHER",
              "severity": "HIGH | MEDIUM | LOW",
              "department": "exact department name",
              "summary": "one sentence summary of the issue",
              "explanation": "2-3 sentence explanation of why this severity was assigned",
              "trustScore": number between 0 and 100,
              "recommendedAction": "specific next step for authorities"
            }
            
            Department routing rules:
            - ROAD_DAMAGE → Roads and Infrastructure Department
            - GARBAGE → Sanitation and Waste Management Department
            - WATER_LEAKAGE → Water Supply and Sewerage Department
            - STREETLIGHT → Electricity and Public Lighting Department
            - ELECTRICITY → Electricity and Public Lighting Department
            - OTHER → Municipal Corporation
            
            Severity rules:
            - HIGH: immediate safety risk, accidents, flooding, live wires, fire hazard
            - MEDIUM: causes inconvenience or will worsen if unaddressed (pothole, broken light, garbage dump)
            - LOW: minor cosmetic or non-urgent issue
            
            TrustScore: rate 0-100 based on how specific and verifiable the report is. 
            High trust = specific location, clear description, plausible issue.
            """,
                request.getTitle(),
                request.getDescription(),
                request.getLocation() != null ? request.getLocation() : "Not specified"
        );
    }

    private String callGeminiApi(String prompt) {
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
        return response.getBody();
    }

    private AiAnalysisResponse parseGeminiResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String text = root
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text").asText();

            // Clean up potential markdown code blocks
            text = text.trim();
            if (text.startsWith("```")) {
                text = text.replaceAll("```json\\n?", "").replaceAll("```\\n?", "").trim();
            }

            return objectMapper.readValue(text, AiAnalysisResponse.class);
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse AI response");
        }
    }

    private AiAnalysisResponse buildFallbackResponse(AiAnalysisRequest request) {
        // Heuristic fallback when Gemini is unavailable
        String text = (request.getTitle() + " " + request.getDescription()).toLowerCase();

        String category = "OTHER";
        String department = "Municipal Corporation";
        if (text.contains("road") || text.contains("pothole") || text.contains("pavement")) {
            category = "ROAD_DAMAGE"; department = "Roads and Infrastructure Department";
        } else if (text.contains("garbage") || text.contains("waste") || text.contains("trash")) {
            category = "GARBAGE"; department = "Sanitation and Waste Management Department";
        } else if (text.contains("water") || text.contains("leakage") || text.contains("pipe")) {
            category = "WATER_LEAKAGE"; department = "Water Supply and Sewerage Department";
        } else if (text.contains("light") || text.contains("streetlight") || text.contains("lamp")) {
            category = "STREETLIGHT"; department = "Electricity and Public Lighting Department";
        } else if (text.contains("electric") || text.contains("wire") || text.contains("power")) {
            category = "ELECTRICITY"; department = "Electricity and Public Lighting Department";
        }

        String severity = "LOW";
        if (text.contains("danger") || text.contains("accident") || text.contains("fire") || text.contains("urgent")) {
            severity = "HIGH";
        } else if (text.contains("broken") || text.contains("damage") || text.contains("leaking")) {
            severity = "MEDIUM";
        }

        return AiAnalysisResponse.builder()
                .category(category)
                .severity(severity)
                .department(department)
                .summary("Civic issue reported: " + request.getTitle())
                .explanation("This issue has been classified based on keywords. Severity assigned as " + severity + " based on the issue description.")
                .trustScore(65)
                .recommendedAction("Assign to " + department + " for inspection and resolution within standard SLA.")
                .build();
    }
}
