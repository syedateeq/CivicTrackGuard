package com.ateeq.backend.service;

import com.ateeq.backend.dto.AiAnalysisRequest;
import com.ateeq.backend.dto.AiAnalysisResponse;
import com.ateeq.backend.dto.AiIntakeRequest;
import com.ateeq.backend.dto.AiIntakeResponse;
import com.ateeq.backend.model.SeverityLevel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiService {

    private final GeminiService geminiService;

    /**
     * Full AI analysis: category, severity, department, summary, explanation, trust score.
     */
    public AiAnalysisResponse analyzeIssue(AiAnalysisRequest request) {
        return geminiService.analyzeIssue(request);
    }

    /**
     * AI Intake Agent: extracts all structured fields from a single natural-language description.
     */
    public AiIntakeResponse intakeAnalyze(AiIntakeRequest request) {
        return geminiService.intakeAnalyze(request);
    }

    /**
     * Quick severity prediction for issue creation (used internally).
     */
    public SeverityLevel predictSeverity(String title, String description) {
        AiAnalysisRequest request = AiAnalysisRequest.builder()
                .title(title)
                .description(description)
                .build();

        try {
            AiAnalysisResponse response = geminiService.analyzeIssue(request);
            return SeverityLevel.valueOf(response.getSeverity());
        } catch (Exception e) {
            // Heuristic fallback
            String text = (title + " " + description).toLowerCase();
            if (text.contains("fire") || text.contains("accident") || text.contains("danger") || text.contains("urgent")) {
                return SeverityLevel.HIGH;
            }
            if (text.contains("pothole") || text.contains("leakage") || text.contains("broken") || text.contains("damaged")) {
                return SeverityLevel.MEDIUM;
            }
            return SeverityLevel.LOW;
        }
    }
}