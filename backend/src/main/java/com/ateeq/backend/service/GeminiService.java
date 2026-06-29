package com.ateeq.backend.service;

import com.ateeq.backend.dto.AiAnalysisRequest;
import com.ateeq.backend.dto.AiAnalysisResponse;
import com.ateeq.backend.dto.AiIntakeRequest;
import com.ateeq.backend.dto.AiIntakeResponse;
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

    // ======================== AI INTAKE AGENT ========================

    /**
     * Enhanced AI intake analysis: extracts ALL structured fields from a single
     * natural-language description. Used by the AI Intake Agent frontend component.
     */
    public AiIntakeResponse intakeAnalyze(AiIntakeRequest request) {
        try {
            String prompt = buildIntakePrompt(request);
            String geminiResponse = callGeminiApi(prompt);
            return parseIntakeResponse(geminiResponse);
        } catch (Exception e) {
            log.error("Gemini intake analysis failed: {}", e.getMessage());
            return buildIntakeFallbackResponse(request);
        }
    }

    private String buildIntakePrompt(AiIntakeRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
            You are CivicTrackGuard's AI Intake Agent \u2014 an intelligent civic issue reporting assistant.
            A citizen has described a civic issue in their own words. Your job is to extract ALL structured
            information from this description and return a complete, ready-to-submit report.

            CITIZEN'S DESCRIPTION:
            """);
        sb.append("\"").append(request.getDescription()).append("\"\n\n");

        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            sb.append("IMAGE URL: ").append(request.getImageUrl()).append("\n");
        }
        if (request.getAddress() != null && !request.getAddress().isBlank()) {
            sb.append("LOCATION: ").append(request.getAddress()).append("\n");
        }
        if (request.getLatitude() != null && request.getLongitude() != null) {
            sb.append("COORDINATES: ").append(request.getLatitude()).append(", ").append(request.getLongitude()).append("\n");
        }

        sb.append("""

            Respond ONLY with valid JSON. No markdown, no extra text, no code blocks.

            Required JSON structure:
            {
              "title": "concise, descriptive title for the issue (max 100 chars)",
              "category": "one of: ROAD_DAMAGE | WATER_LEAKAGE | GARBAGE | STREETLIGHT | SEWAGE | ELECTRICITY | TRAFFIC | PUBLIC_SAFETY | OTHER",
              "severity": "one of: LOW | MEDIUM | HIGH | CRITICAL",
              "department": "one of: Roads | Water | Electricity | Sanitation | Traffic Police | Municipality | Other",
              "summary": "2-3 sentence professional summary of the issue for authorities",
              "priority": "one of: LOW | MEDIUM | HIGH | URGENT",
              "tags": ["tag1", "tag2", "tag3"],
              "suggestedResolution": "specific, actionable recommendation for the department",
              "estimatedResolutionTime": "estimated time (e.g., '2-3 days', '1 week', '24 hours')",
              "confidenceScore": number between 0 and 100,
              "reasoning": "brief explanation of why you chose this category, severity, and department"
            }

            CATEGORY RULES:
            - ROAD_DAMAGE: potholes, cracks, broken roads, damaged pavements, speed bumps issues
            - WATER_LEAKAGE: water pipe bursts, leaking taps, water supply issues, flooding from pipes
            - GARBAGE: garbage overflow, illegal dumping, waste not collected, dirty areas
            - STREETLIGHT: broken/flickering streetlights, dark streets, lamp post damage
            - SEWAGE: blocked drains, sewage overflow, manhole issues, open drains
            - ELECTRICITY: power outages, exposed wires, transformer issues, electric pole damage
            - TRAFFIC: broken signals, missing signs, illegal parking, road blockages
            - PUBLIC_SAFETY: accidents, unsafe structures, fire hazards, dangerous conditions
            - OTHER: anything that doesn't fit above categories

            SEVERITY RULES:
            - CRITICAL: immediate life-threatening danger (live wires, building collapse, gas leak, active fire)
            - HIGH: safety risk or accidents already occurring (people injured, flooding, major road damage)
            - MEDIUM: significant inconvenience, will worsen without action (large pothole, persistent leakage, garbage accumulation)
            - LOW: minor/cosmetic issues, no immediate safety risk (small cracks, dim streetlight, minor littering)

            DEPARTMENT ROUTING:
            - Roads: road damage, potholes, pavements, speed bumps
            - Water: water leakage, supply issues, pipe bursts
            - Electricity: streetlights, power issues, electrical hazards
            - Sanitation: garbage, waste management, cleaning
            - Traffic Police: traffic signals, signs, road safety
            - Municipality: general civic issues, public facilities
            - Other: anything else

            PRIORITY RULES:
            - URGENT: CRITICAL severity issues requiring immediate response
            - HIGH: HIGH severity or issues affecting many people
            - MEDIUM: MEDIUM severity, needs attention within days
            - LOW: LOW severity, can be scheduled normally

            CONFIDENCE SCORING:
            - 90-100: very specific location, clear issue description, verifiable
            - 70-89: good description but missing some details
            - 50-69: vague description, unclear location
            - below 50: very unclear, might need clarification

            Generate 2-5 relevant tags (lowercase, single words or short phrases).
            """);

        return sb.toString();
    }

    private AiIntakeResponse parseIntakeResponse(String responseBody) {
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

            AiIntakeResponse response = objectMapper.readValue(text, AiIntakeResponse.class);

            // Sanitize & validate the response
            response = sanitizeIntakeResponse(response);

            return response;
        } catch (Exception e) {
            log.error("Failed to parse Gemini intake response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse AI intake response");
        }
    }

    private AiIntakeResponse sanitizeIntakeResponse(AiIntakeResponse response) {
        // Validate category
        var validCategories = List.of("ROAD_DAMAGE", "WATER_LEAKAGE", "GARBAGE", "STREETLIGHT",
                "SEWAGE", "ELECTRICITY", "TRAFFIC", "PUBLIC_SAFETY", "OTHER");
        if (response.getCategory() == null || !validCategories.contains(response.getCategory())) {
            response.setCategory("OTHER");
        }

        // Validate severity
        var validSeverities = List.of("LOW", "MEDIUM", "HIGH", "CRITICAL");
        if (response.getSeverity() == null || !validSeverities.contains(response.getSeverity())) {
            response.setSeverity("MEDIUM");
        }

        // Validate priority
        var validPriorities = List.of("LOW", "MEDIUM", "HIGH", "URGENT");
        if (response.getPriority() == null || !validPriorities.contains(response.getPriority())) {
            response.setPriority("MEDIUM");
        }

        // Validate department
        var validDepartments = List.of("Roads", "Water", "Electricity", "Sanitation",
                "Traffic Police", "Municipality", "Other");
        if (response.getDepartment() == null || !validDepartments.contains(response.getDepartment())) {
            response.setDepartment("Municipality");
        }

        // Clamp confidence score
        if (response.getConfidenceScore() == null || response.getConfidenceScore() < 0) {
            response.setConfidenceScore(50);
        } else if (response.getConfidenceScore() > 100) {
            response.setConfidenceScore(100);
        }

        // Truncate title
        if (response.getTitle() != null && response.getTitle().length() > 150) {
            response.setTitle(response.getTitle().substring(0, 150));
        }

        // Ensure tags list is not null
        if (response.getTags() == null) {
            response.setTags(List.of());
        }

        // Ensure non-null defaults
        if (response.getTitle() == null) response.setTitle("Civic Issue Report");
        if (response.getSummary() == null) response.setSummary("");
        if (response.getSuggestedResolution() == null) response.setSuggestedResolution("");
        if (response.getEstimatedResolutionTime() == null) response.setEstimatedResolutionTime("3-5 business days");
        if (response.getReasoning() == null) response.setReasoning("");

        return response;
    }

    private AiIntakeResponse buildIntakeFallbackResponse(AiIntakeRequest request) {
        String text = request.getDescription().toLowerCase();

        String category = "OTHER";
        String department = "Municipality";
        if (text.contains("road") || text.contains("pothole") || text.contains("pavement") || text.contains("crack")) {
            category = "ROAD_DAMAGE"; department = "Roads";
        } else if (text.contains("garbage") || text.contains("waste") || text.contains("trash") || text.contains("dump")) {
            category = "GARBAGE"; department = "Sanitation";
        } else if (text.contains("water") || text.contains("leakage") || text.contains("pipe") || text.contains("flood")) {
            category = "WATER_LEAKAGE"; department = "Water";
        } else if (text.contains("light") || text.contains("streetlight") || text.contains("lamp") || text.contains("dark street")) {
            category = "STREETLIGHT"; department = "Electricity";
        } else if (text.contains("electric") || text.contains("wire") || text.contains("power") || text.contains("transformer")) {
            category = "ELECTRICITY"; department = "Electricity";
        } else if (text.contains("sewage") || text.contains("drain") || text.contains("manhole")) {
            category = "SEWAGE"; department = "Sanitation";
        } else if (text.contains("traffic") || text.contains("signal") || text.contains("parking")) {
            category = "TRAFFIC"; department = "Traffic Police";
        } else if (text.contains("accident") || text.contains("fire") || text.contains("collapse") || text.contains("danger")) {
            category = "PUBLIC_SAFETY"; department = "Municipality";
        }

        String severity = "LOW";
        String priority = "LOW";
        if (text.contains("danger") || text.contains("accident") || text.contains("fire") || text.contains("collapse") || text.contains("live wire")) {
            severity = "CRITICAL"; priority = "URGENT";
        } else if (text.contains("slip") || text.contains("injur") || text.contains("flood") || text.contains("major")) {
            severity = "HIGH"; priority = "HIGH";
        } else if (text.contains("broken") || text.contains("damage") || text.contains("leaking") || text.contains("overflow")) {
            severity = "MEDIUM"; priority = "MEDIUM";
        }

        // Generate a simple title from first 80 chars
        String title = request.getDescription().length() > 80
                ? request.getDescription().substring(0, 80).trim() + "..."
                : request.getDescription().trim();
        // Capitalize first letter
        if (!title.isEmpty()) {
            title = title.substring(0, 1).toUpperCase() + title.substring(1);
        }

        return AiIntakeResponse.builder()
                .title(title)
                .category(category)
                .severity(severity)
                .department(department)
                .summary("Civic issue reported by citizen: " + request.getDescription().substring(0, Math.min(200, request.getDescription().length())))
                .priority(priority)
                .tags(List.of(category.toLowerCase().replace("_", "-"), severity.toLowerCase()))
                .suggestedResolution("Assign to " + department + " department for inspection and resolution.")
                .estimatedResolutionTime("3-5 business days")
                .confidenceScore(55)
                .reasoning("This issue was classified using keyword analysis (AI service was unavailable). The category and severity are based on keywords found in the description.")
                .build();
    }

    // ======================== DUPLICATE DETECTION ========================

    /**
     * Simple DTO to carry candidate issue summaries for the Gemini prompt.
     */
    public static class CandidateSummary {
        public Long id;
        public String title;
        public String description;
        public String address;
        public String category;

        public CandidateSummary(Long id, String title, String description, String address, String category) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.address = address;
            this.category = category;
        }
    }

    /**
     * Individual similarity result from Gemini.
     */
    public static class SimilarityResult {
        public Long issueId;
        public int similarityScore;
        public String matchReason;
    }

    /**
     * Uses Gemini AI to score how similar a new issue description is to a list of
     * existing candidate issues. Returns a list of scored results.
     * Falls back to an empty list on any failure.
     */
    public List<SimilarityResult> checkDuplicates(String newDescription, String newCategory,
                                                   String newAddress, List<CandidateSummary> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }

        try {
            String prompt = buildDuplicatePrompt(newDescription, newCategory, newAddress, candidates);
            String geminiResponse = callGeminiApi(prompt);
            return parseDuplicateResponse(geminiResponse, candidates);
        } catch (Exception e) {
            log.error("Gemini duplicate detection failed: {}", e.getMessage());
            return List.of();
        }
    }

    private String buildDuplicatePrompt(String newDescription, String newCategory,
                                         String newAddress, List<CandidateSummary> candidates) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
            You are a duplicate issue detector for a civic issue reporting platform called CivicTrackGuard.
            A citizen is about to report a new issue. Your job is to check whether any EXISTING issues
            in the system describe the SAME real-world problem (same physical issue at the same or very nearby location).

            NEW ISSUE being reported:
            """);
        sb.append("Description: \"").append(newDescription).append("\"\n");
        sb.append("Category: ").append(newCategory != null ? newCategory : "Not specified").append("\n");
        sb.append("Location: ").append(newAddress != null ? newAddress : "Not specified").append("\n\n");

        sb.append("EXISTING ISSUES to compare against:\n");
        for (int i = 0; i < candidates.size(); i++) {
            CandidateSummary c = candidates.get(i);
            sb.append(String.format("[ID=%d] Title: \"%s\" | Description: \"%s\" | Location: \"%s\" | Category: %s\n",
                    c.id,
                    truncateForPrompt(c.title, 100),
                    truncateForPrompt(c.description, 300),
                    c.address != null ? c.address : "N/A",
                    c.category != null ? c.category : "N/A"));
        }

        sb.append("""

            INSTRUCTIONS:
            For each existing issue, determine how likely it is that the NEW ISSUE is describing the SAME
            real-world problem (not just the same category — the same specific incident or location).

            Respond ONLY with a valid JSON array. No markdown, no extra text, no code blocks.
            Each element must have:
            {
              "issueId": <the ID number>,
              "similarityScore": <0 to 100>,
              "matchReason": "brief explanation of why this is or isn't a match"
            }

            SCORING GUIDE:
            - 90-100: Almost certainly the same issue (same location, same problem described)
            - 70-89: Very likely the same issue (very similar description and nearby location)
            - 50-69: Possibly the same issue (similar problem type, somewhat nearby)
            - 30-49: Unlikely but worth noting (same category, different specifics)
            - 0-29: Not a match

            Only include issues with similarityScore >= 30 in your response.
            If no issues match, return an empty array: []
            """);

        return sb.toString();
    }

    private List<SimilarityResult> parseDuplicateResponse(String responseBody, List<CandidateSummary> candidates) {
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

            // Parse as array
            JsonNode arrayNode = objectMapper.readTree(text);
            List<SimilarityResult> results = new java.util.ArrayList<>();

            if (arrayNode.isArray()) {
                // Collect valid candidate IDs for validation
                var validIds = candidates.stream().map(c -> c.id).collect(java.util.stream.Collectors.toSet());

                for (JsonNode node : arrayNode) {
                    SimilarityResult result = new SimilarityResult();
                    result.issueId = node.path("issueId").asLong();
                    result.similarityScore = node.path("similarityScore").asInt();
                    result.matchReason = node.path("matchReason").asText("");

                    // Validate: only include results for known candidate IDs with score >= 30
                    if (validIds.contains(result.issueId) && result.similarityScore >= 30) {
                        result.similarityScore = Math.min(result.similarityScore, 100);
                        results.add(result);
                    }
                }
            }

            // Sort by score descending
            results.sort((a, b) -> Integer.compare(b.similarityScore, a.similarityScore));
            return results;
        } catch (Exception e) {
            log.error("Failed to parse Gemini duplicate response: {}", e.getMessage());
            return List.of();
        }
    }

    private String truncateForPrompt(String text, int maxLen) {
        if (text == null) return "";
        if (text.length() <= maxLen) return text;
        return text.substring(0, maxLen) + "...";
    }

    // ======================== OFFICER AI COPILOT ========================

    /**
     * Specialized prompt method for the Officer AI Copilot.
     * Injects a dynamic system context (aggregated active issue stats) along with the officer's question.
     */
    public String officerCopilotAsk(String systemContext, String userQuestion) {
        try {
            String fullPrompt = """
                You are the Officer AI Copilot for CivicTrackGuard, assisting city administrators and officers.
                Your goal is to help them manage civic issues effectively based on the live system snapshot provided below.
                
                You must answer their questions clearly, professionally, and concisely.
                Use bullet points for lists. Focus on actionable insights.
                Do NOT hallucinate data. Only use the data from the snapshot provided.
                If the question cannot be answered using the provided snapshot, politely explain that you don't have that specific information in your current view.
                
                CURRENT SYSTEM SNAPSHOT:
                ------------------------
                """ + systemContext + """
                ------------------------
                
                Officer's Question:
                """ + userQuestion + """
                
                Response:
                """;
            String geminiResponse = callGeminiApi(fullPrompt);
            return extractTextFromGeminiResponse(geminiResponse);
        } catch (Exception e) {
            log.error("Officer Copilot Gemini call failed: {}", e.getMessage());
            return null; // The service handles null with a rule-based fallback
        }
    }

    private String extractTextFromGeminiResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String text = root
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text").asText();
            
            // Clean up markdown block if present
            text = text.trim();
            if (text.startsWith("```")) {
                text = text.replaceAll("```json\\n?", "").replaceAll("```\\n?", "").trim();
            }
            return text;
        } catch (Exception e) {
            log.error("Failed to parse Gemini text response: {}", e.getMessage());
            throw new RuntimeException("Failed to extract text from AI response");
        }
    }
}

