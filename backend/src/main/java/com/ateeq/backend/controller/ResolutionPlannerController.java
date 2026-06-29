package com.ateeq.backend.controller;

import com.ateeq.backend.dto.ResolutionPlanResponse;
import com.ateeq.backend.service.ResolutionPlannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResolutionPlannerController {

    private final ResolutionPlannerService resolutionPlannerService;

    @GetMapping("/resolution-plan/{issueId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResolutionPlanResponse> getResolutionPlan(@PathVariable Long issueId) {
        return ResponseEntity.ok(resolutionPlannerService.getPlan(issueId));
    }

    @PostMapping("/resolution-plan/{issueId}/regenerate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResolutionPlanResponse> regenerateResolutionPlan(@PathVariable Long issueId) {
        return ResponseEntity.ok(resolutionPlannerService.regeneratePlan(issueId));
    }
}
