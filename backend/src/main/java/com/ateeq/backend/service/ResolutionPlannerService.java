package com.ateeq.backend.service;

import com.ateeq.backend.dto.ResolutionPlanResponse;
import com.ateeq.backend.model.Issue;
import com.ateeq.backend.repository.IssueRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResolutionPlannerService {

    private final IssueRepository issueRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public ResolutionPlanResponse getPlan(Long issueId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found with ID: " + issueId));

        if (issue.getResolutionPlan() != null && !issue.getResolutionPlan().isBlank()) {
            try {
                return objectMapper.readValue(issue.getResolutionPlan(), ResolutionPlanResponse.class);
            } catch (JsonProcessingException e) {
                log.error("Failed to parse cached resolution plan for issue {}, regenerating...", issueId);
                // Fall through to regeneration
            }
        }

        return generateAndSavePlan(issue);
    }

    public ResolutionPlanResponse regeneratePlan(Long issueId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found with ID: " + issueId));
        return generateAndSavePlan(issue);
    }

    private ResolutionPlanResponse generateAndSavePlan(Issue issue) {
        ResolutionPlanResponse plan = geminiService.generateResolutionPlan(issue);
        
        try {
            String planJson = objectMapper.writeValueAsString(plan);
            issue.setResolutionPlan(planJson);
            issueRepository.save(issue);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize generated resolution plan for issue {}: {}", issue.getId(), e.getMessage());
            // It's safe to return the plan even if caching fails
        }
        
        return plan;
    }
}
