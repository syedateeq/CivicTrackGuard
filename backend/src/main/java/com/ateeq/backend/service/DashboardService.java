package com.ateeq.backend.service;

import com.ateeq.backend.dto.CategoryStatsResponse;
import com.ateeq.backend.dto.DashboardResponse;
import com.ateeq.backend.dto.SeverityStatsResponse;
import com.ateeq.backend.model.Issue;
import com.ateeq.backend.model.IssueStatus;
import com.ateeq.backend.model.SeverityLevel;
import com.ateeq.backend.repository.IssueRepository;
import com.ateeq.backend.repository.UserRepository;
import com.ateeq.backend.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;

    public DashboardResponse getStats() {
        long totalIssues = issueRepository.count();
        long pendingIssues = issueRepository.countByStatus(IssueStatus.PENDING);
        long resolvedIssues = issueRepository.countByStatus(IssueStatus.RESOLVED);
        long inProgressIssues = issueRepository.countByStatus(IssueStatus.IN_PROGRESS);
        long highSeverityIssues = issueRepository.countBySeverity(SeverityLevel.HIGH);
        long totalUsers = userRepository.count();
        long totalVotes = voteRepository.count();

        return DashboardResponse.builder()
                .totalIssues(totalIssues)
                .pendingIssues(pendingIssues)
                .resolvedIssues(resolvedIssues)
                .inProgressIssues(inProgressIssues)
                .highSeverityIssues(highSeverityIssues)
                .totalUsers(totalUsers)
                .totalVotes(totalVotes)
                .build();
    }

    public List<SeverityStatsResponse> getSeverityStats() {
        List<Issue> issues = issueRepository.findAll();

        Map<String, Long> severityCounts = issues.stream()
                .filter(issue -> issue.getSeverity() != null)
                .collect(Collectors.groupingBy(
                        issue -> issue.getSeverity().name(),
                        Collectors.counting()
                ));

        return severityCounts.entrySet().stream()
                .map(entry -> new SeverityStatsResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    public List<CategoryStatsResponse> getCategoryStats() {
        List<Issue> issues = issueRepository.findAll();

        Map<String, Long> categoryCounts = issues.stream()
                .filter(issue -> issue.getCategory() != null)
                .collect(Collectors.groupingBy(
                        Issue::getCategory,
                        Collectors.counting()
                ));

        return categoryCounts.entrySet().stream()
                .map(entry -> new CategoryStatsResponse(entry.getKey(), entry.getValue()))
                .toList();
    }
}