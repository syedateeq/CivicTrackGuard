package com.ateeq.backend.controller;

import com.ateeq.backend.dto.CategoryStatsResponse;
import com.ateeq.backend.dto.DashboardResponse;
import com.ateeq.backend.dto.SeverityStatsResponse;
import com.ateeq.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public DashboardResponse getStats() {
        return dashboardService.getStats();
    }

    @GetMapping("/category")
    public List<CategoryStatsResponse> getCategoryStats() {
        return dashboardService.getCategoryStats();
    }

    @GetMapping("/severity")
    public List<SeverityStatsResponse> getSeverityStats() {
        return dashboardService.getSeverityStats();
    }
}