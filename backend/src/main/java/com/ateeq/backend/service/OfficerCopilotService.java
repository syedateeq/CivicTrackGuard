package com.ateeq.backend.service;

import com.ateeq.backend.dto.CopilotInsight;
import com.ateeq.backend.dto.CopilotRequest;
import com.ateeq.backend.dto.CopilotResponse;
import com.ateeq.backend.dto.PrioritizedIssue;
import com.ateeq.backend.model.Issue;
import com.ateeq.backend.model.IssueStatus;
import com.ateeq.backend.model.SeverityLevel;
import com.ateeq.backend.repository.IssueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OfficerCopilotService {

    private final IssueRepository issueRepository;
    private final GeminiService geminiService;

    // Defines "active" issues we care about for the copilot
    private static final List<IssueStatus> ACTIVE_STATUSES = List.of(
            IssueStatus.PENDING, IssueStatus.VERIFIED, IssueStatus.IN_PROGRESS
    );

    // =================================================================================
    // 1. CHAT FUNCTIONALITY
    // =================================================================================

    public CopilotResponse askQuestion(CopilotRequest request) {
        String snapshot = buildSystemSnapshot();
        
        String aiResponse = geminiService.officerCopilotAsk(snapshot, request.getMessage());
        
        if (aiResponse != null && !aiResponse.isBlank()) {
            return CopilotResponse.builder()
                    .reply(aiResponse)
                    .type("chat")
                    .fallback(false)
                    .build();
        }

        // Fallback if AI fails
        log.warn("Copilot AI failed, using rule-based fallback.");
        return CopilotResponse.builder()
                .reply(generateRuleBasedFallback(request.getMessage(), snapshot))
                .type("fallback")
                .fallback(true)
                .build();
    }

    private String buildSystemSnapshot() {
        StringBuilder sb = new StringBuilder();

        // 1. Overall counts
        long pending = issueRepository.countByStatus(IssueStatus.PENDING);
        long inProgress = issueRepository.countByStatus(IssueStatus.IN_PROGRESS);
        long highSeverity = issueRepository.countBySeverity(SeverityLevel.HIGH) + issueRepository.countBySeverity(SeverityLevel.CRITICAL);
        
        sb.append(String.format("Global Stats: %d Pending, %d In Progress, %d High/Critical Severity\n\n", 
                pending, inProgress, highSeverity));

        // 2. Department workloads
        List<Object[]> workloads = issueRepository.countActiveByDepartment();
        sb.append("Active Workload by Department:\n");
        for (Object[] row : workloads) {
            String dept = row[0] != null ? row[0].toString() : "Unassigned";
            long count = (Long) row[1];
            sb.append("- ").append(dept).append(": ").append(count).append(" issues\n");
        }
        sb.append("\n");

        // 3. Top 10 most urgent/active issues (compact)
        List<Issue> topIssues = issueRepository.findByStatusIn(ACTIVE_STATUSES, 
                Sort.by(Sort.Direction.DESC, "severity").and(Sort.by(Sort.Direction.ASC, "createdAt")))
                .stream().limit(10).toList();
        
        sb.append("Top 10 Priority Active Issues:\n");
        for (Issue i : topIssues) {
            long daysOld = i.getCreatedAt() != null ? ChronoUnit.DAYS.between(i.getCreatedAt(), LocalDateTime.now()) : 0;
            sb.append(String.format("[ID:%d] %s | %s | Dept: %s | %d days old | %d votes\n",
                    i.getId(), i.getTitle(), i.getSeverity(), 
                    i.getDepartment() != null ? i.getDepartment() : "None", 
                    daysOld, i.getUpvoteCount()));
        }

        return sb.toString();
    }

    private String generateRuleBasedFallback(String question, String snapshot) {
        String q = question.toLowerCase();
        if (q.contains("department") || q.contains("workload")) {
            return "AI service is temporarily unavailable, but here is the raw workload data:\n\n" + snapshot.split("Top 10")[0];
        } else if (q.contains("priority") || q.contains("urgent")) {
            return "AI service is temporarily unavailable, but here are the top 10 priority issues:\n\n" + snapshot.split("Active Issues:")[1];
        } else {
            return "The AI Copilot is currently offline. Please try again in a few minutes, or refer to the standard dashboard for issue tracking.";
        }
    }

    // =================================================================================
    // 2. INSIGHTS (PURE DB, FAST)
    // =================================================================================

    public List<CopilotInsight> getInsights() {
        List<CopilotInsight> insights = new ArrayList<>();
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);

        // 1. Total Active
        long active = issueRepository.countByStatus(IssueStatus.PENDING) + 
                      issueRepository.countByStatus(IssueStatus.VERIFIED) + 
                      issueRepository.countByStatus(IssueStatus.IN_PROGRESS);
        insights.add(CopilotInsight.builder()
                .title("Active Issues")
                .value(String.valueOf(active))
                .trend("Needs attention")
                .icon("activity")
                .color("text-blue-400")
                .description("Total unresolved issues")
                .build());

        // 2. High/Critical Severity
        long urgent = issueRepository.countBySeverity(SeverityLevel.HIGH) + 
                      issueRepository.countBySeverity(SeverityLevel.CRITICAL);
        insights.add(CopilotInsight.builder()
                .title("Urgent Priority")
                .value(String.valueOf(urgent))
                .trend(urgent > 5 ? "Action required" : "Under control")
                .icon("alert")
                .color("text-red-400")
                .description("High & Critical severity")
                .build());

        // 3. Overdue (>7 days old and not resolved)
        long overdue = issueRepository.findOverdueIssues(oneWeekAgo).size();
        insights.add(CopilotInsight.builder()
                .title("Overdue Issues")
                .value(String.valueOf(overdue))
                .trend("> 7 days old")
                .icon("clock")
                .color("text-orange-400")
                .description("Aging active issues")
                .build());

        // 4. Most Loaded Department
        List<Object[]> workloads = issueRepository.countActiveByDepartment();
        String maxDept = "None";
        long maxCount = 0;
        for (Object[] row : workloads) {
            if (row[0] != null && (Long) row[1] > maxCount) {
                maxDept = row[0].toString();
                maxCount = (Long) row[1];
            }
        }
        insights.add(CopilotInsight.builder()
                .title("Busiest Dept")
                .value(maxDept)
                .trend(maxCount + " active issues")
                .icon("briefcase")
                .color("text-purple-400")
                .description("Highest current workload")
                .build());

        return insights;
    }

    // =================================================================================
    // 3. SMART PRIORITIZATION
    // =================================================================================

    public List<PrioritizedIssue> getPriorities() {
        // Fetch top 15 active issues ordered loosely by severity and age
        List<Issue> candidates = issueRepository.findByStatusIn(ACTIVE_STATUSES, 
                Sort.by(Sort.Direction.DESC, "severity").and(Sort.by(Sort.Direction.ASC, "createdAt")));
        
        if (candidates.isEmpty()) {
            return List.of();
        }

        // Limit to 15 for scoring
        candidates = candidates.stream().limit(15).toList();
        List<PrioritizedIssue> prioritized = new ArrayList<>();

        for (Issue issue : candidates) {
            long ageDays = issue.getCreatedAt() != null ? ChronoUnit.DAYS.between(issue.getCreatedAt(), LocalDateTime.now()) : 0;
            int score = calculatePriorityScore(issue, ageDays);
            
            prioritized.add(PrioritizedIssue.builder()
                    .issueId(issue.getId())
                    .title(issue.getTitle() != null ? issue.getTitle() : "Untitled")
                    .category(issue.getCategory() != null ? issue.getCategory() : "Uncategorized")
                    .severity(issue.getSeverity() != null ? issue.getSeverity().name() : "LOW")
                    .status(issue.getStatus() != null ? issue.getStatus().name() : "PENDING")
                    .address(issue.getAddress() != null ? issue.getAddress() : "Location not specified")
                    .ageInDays(ageDays)
                    .upvotes(issue.getUpvoteCount() != null ? issue.getUpvoteCount() : 0)
                    .priorityScore(score)
                    // AI reasoning will be populated later or fall back to generic
                    .reasoning("Priority calculated based on severity, age, and community impact.")
                    .build());
        }

        // Sort by score descending and take top 5
        prioritized.sort((a, b) -> Integer.compare(b.getPriorityScore(), a.getPriorityScore()));
        List<PrioritizedIssue> top5 = prioritized.stream().limit(5).collect(Collectors.toList());
        
        // Assign ranks
        for (int i = 0; i < top5.size(); i++) {
            top5.get(i).setPriorityRank(i + 1);
        }

        // Optional: Ask Gemini for quick reasoning for the top 5
        try {
            enrichWithAiReasoning(top5);
        } catch (Exception e) {
            log.warn("AI reasoning enrichment failed, using rule-based reasoning.");
        }

        return top5;
    }

    private int calculatePriorityScore(Issue issue, long ageDays) {
        int score = 0;
        
        // Severity weight (Max 40)
        if (issue.getSeverity() == SeverityLevel.CRITICAL) score += 40;
        else if (issue.getSeverity() == SeverityLevel.HIGH) score += 30;
        else if (issue.getSeverity() == SeverityLevel.MEDIUM) score += 15;
        else score += 5;

        // Age weight (Max 25)
        if (ageDays > 30) score += 25;
        else if (ageDays > 14) score += 20;
        else if (ageDays > 7) score += 15;
        else if (ageDays > 3) score += 10;
        else score += 5;

        // Upvote weight (Max 20)
        long votes = issue.getUpvoteCount() != null ? issue.getUpvoteCount() : 0;
        if (votes > 50) score += 20;
        else if (votes > 20) score += 15;
        else if (votes > 5) score += 10;
        else if (votes > 0) score += 5;

        // Status weight (Max 15)
        if (issue.getStatus() != null) {
            if (issue.getStatus() == IssueStatus.PENDING) score += 15;
            else if (issue.getStatus() == IssueStatus.VERIFIED) score += 10;
            else if (issue.getStatus() == IssueStatus.IN_PROGRESS) score += 5;
        }

        return Math.min(score, 100);
    }

    private void enrichWithAiReasoning(List<PrioritizedIssue> issues) {
        StringBuilder prompt = new StringBuilder("You are an AI assistant prioritizing civic issues. Provide a ONE SENTENCE reason (max 20 words) why each of the following issues is a priority. Return ONLY the reasons, one per line in the same order.\n\n");
        for (PrioritizedIssue i : issues) {
            prompt.append("- [").append(i.getSeverity()).append("] ").append(i.getTitle())
                  .append(" (").append(i.getAgeInDays()).append(" days old, ").append(i.getUpvotes()).append(" votes)\n");
        }

        String aiResponse = geminiService.officerCopilotAsk("", prompt.toString());
        if (aiResponse != null && !aiResponse.isBlank()) {
            String[] lines = aiResponse.split("\n");
            int idx = 0;
            for (String line : lines) {
                if (line.trim().startsWith("-")) line = line.substring(line.indexOf("-") + 1).trim();
                if (line.trim().startsWith("*")) line = line.substring(line.indexOf("*") + 1).trim();
                if (!line.isBlank() && idx < issues.size()) {
                    issues.get(idx).setReasoning(line.trim());
                    idx++;
                }
            }
        }
    }
}
