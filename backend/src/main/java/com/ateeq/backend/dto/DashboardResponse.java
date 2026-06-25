package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardResponse {
    private long totalIssues;
    private long pendingIssues;
    private long resolvedIssues;
    private long inProgressIssues;
    private long highSeverityIssues;
    private long totalUsers;
    private long totalVotes;
}