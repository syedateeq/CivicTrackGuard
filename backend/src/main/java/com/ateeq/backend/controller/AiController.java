package com.ateeq.backend.controller;

import com.ateeq.backend.dto.AiAnalysisRequest;
import com.ateeq.backend.dto.AiAnalysisResponse;
import com.ateeq.backend.dto.AiIntakeRequest;
import com.ateeq.backend.dto.AiIntakeResponse;
import com.ateeq.backend.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    /**
     * POST /api/ai/analyze
     * Analyzes an issue using Gemini AI and returns structured prediction.
     * Called from the frontend "AI Analyze" button before submitting the issue.
     */
    @PostMapping("/analyze")
    public AiAnalysisResponse analyzeIssue(@RequestBody AiAnalysisRequest request) {
        return aiService.analyzeIssue(request);
    }

    /**
     * POST /api/ai/intake
     * AI Intake Agent — accepts a natural-language description and returns
     * a fully structured issue report ready for user review and submission.
     */
    @PostMapping("/intake")
    public AiIntakeResponse intakeAnalyze(@Valid @RequestBody AiIntakeRequest request) {
        return aiService.intakeAnalyze(request);
    }
}

