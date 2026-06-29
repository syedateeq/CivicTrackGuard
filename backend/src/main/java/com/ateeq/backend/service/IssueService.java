package com.ateeq.backend.service;

import com.ateeq.backend.dto.IssueRequest;
import com.ateeq.backend.dto.IssueResponse;
import com.ateeq.backend.exception.ResourceNotFoundException;
import com.ateeq.backend.model.*;
import com.ateeq.backend.repository.CommentRepository;
import com.ateeq.backend.repository.IssueRepository;
import com.ateeq.backend.repository.UserRepository;
import com.ateeq.backend.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;
    private final AiService aiService;
    private final EmailService emailService;

    public IssueResponse createIssue(IssueRequest request) {
        // Get user from JWT security context — not from request body
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        // Use severity from request if provided (AI intake), otherwise predict
        SeverityLevel severity = SeverityLevel.MEDIUM;
        String department = request.getDepartment();

        if (request.getSeverity() != null && !request.getSeverity().isBlank()) {
            // Frontend passed severity explicitly (from AI Intake Agent)
            try {
                severity = SeverityLevel.valueOf(request.getSeverity().toUpperCase());
            } catch (Exception ignored) {
                severity = SeverityLevel.MEDIUM;
            }
        } else if (request.getAiSummary() == null) {
            // No AI data at all — analyze on the fly
            try {
                var aiResponse = aiService.analyzeIssue(
                    com.ateeq.backend.dto.AiAnalysisRequest.builder()
                        .title(request.getTitle())
                        .description(request.getDescription())
                        .location(request.getAddress())
                        .build()
                );
                severity = SeverityLevel.valueOf(aiResponse.getSeverity());
                if (department == null || department.isBlank()) {
                    department = aiResponse.getDepartment();
                }
            } catch (Exception e) {
                severity = aiService.predictSeverity(request.getTitle(), request.getDescription());
            }
        }

        Issue issue = Issue.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .department(department)
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .imageUrl(request.getImageUrl())
                .status(IssueStatus.PENDING)
                .severity(severity)
                .aiSummary(request.getAiSummary())
                .aiExplanation(request.getAiExplanation())
                .trustScore(request.getTrustScore())
                .priority(request.getPriority())
                .tags(request.getTags())
                .createdAt(LocalDateTime.now())
                .user(user)
                .build();

        Issue savedIssue = issueRepository.save(issue);

        // Award points for reporting
        user.setPoints(user.getPoints() + 5);
        userRepository.save(user);

        return toResponse(savedIssue);
    }

    private String extractSeverityFromRequest(IssueRequest request) {
        // If frontend passed severity in summary field (legacy), parse it
        return "MEDIUM";
    }

    public List<IssueResponse> getAllIssues() {
        return issueRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toResponse).toList();
    }

    public IssueResponse getIssueById(Long id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + id));
        return toResponse(issue);
    }

    public List<IssueResponse> getIssuesByCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        return issueRepository.findByUserId(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public IssueResponse updateStatus(Long id, String status, String department) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        IssueStatus newStatus = IssueStatus.valueOf(status.toUpperCase());
        IssueStatus oldStatus = issue.getStatus();
        
        issue.setStatus(newStatus);
        if (department != null && !department.trim().isEmpty()) {
            issue.setDepartment(department);
        }
        Issue updated = issueRepository.save(issue);

        if (oldStatus != newStatus) {
            User reporter = issue.getUser();
            if (reporter != null) {
                if (newStatus == IssueStatus.VERIFIED) {
                    reporter.setPoints(reporter.getPoints() + 10);
                } else if (newStatus == IssueStatus.RESOLVED) {
                    reporter.setPoints(reporter.getPoints() + 20);
                } else if (newStatus == IssueStatus.REJECTED) {
                    reporter.setPoints(reporter.getPoints() - 5);
                }
                userRepository.save(reporter);
            }
        }

        // Notify the reporter
        try {
            notificationService.createNotification(
                    issue.getUser().getId(),
                    "Your issue \"" + issue.getTitle() + "\" status changed to " + status
            );
        } catch (Exception ignored) {}

        // Email notification (best-effort)
        try {
            emailService.sendEmail(
                    issue.getUser().getEmail(),
                    "CivicTrackGuard: Issue Status Updated",
                    "Your issue \"" + issue.getTitle() + "\" status has been updated to: " + status
            );
        } catch (Exception e) {
            // Email is optional — do not break the flow
        }

        return toResponse(updated);
    }

    public void deleteIssue(Long id) {
        issueRepository.deleteById(id);
    }

    public List<IssueResponse> getIssuesByStatus(String status) {
        return issueRepository.findByStatus(IssueStatus.valueOf(status.toUpperCase()))
                .stream().map(this::toResponse).toList();
    }

    public List<IssueResponse> getIssuesByCategory(String category) {
        return issueRepository.findByCategory(category.toUpperCase())
                .stream().map(this::toResponse).toList();
    }

    public Page<IssueResponse> getIssuesPaginated(int page, int size) {
        return issueRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
    }

    public Page<IssueResponse> searchIssues(String keyword, int page, int size) {
        return issueRepository.searchByKeyword(keyword, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
    }

    public IssueResponse toResponse(Issue issue) {
        if (issue.getId() == null) {
            // Unsaved entity – return minimal response without DB lookups
            return IssueResponse.builder()
                    .title(issue.getTitle())
                    .status(issue.getStatus() != null ? issue.getStatus().name() : "PENDING")
                    .severity(issue.getSeverity() != null ? issue.getSeverity().name() : "LOW")
                    .build();
        }

        long upvotes = issue.getUpvoteCount() != null ? issue.getUpvoteCount() : 0L;
        long downvotes = issue.getDownvoteCount() != null ? issue.getDownvoteCount() : 0L;
        long commentCount = issue.getCommentCount() != null ? issue.getCommentCount() : 0L;

        return IssueResponse.builder()
                .id(issue.getId())
                .title(issue.getTitle())
                .description(issue.getDescription())
                .category(issue.getCategory())
                .department(issue.getDepartment())
                .address(issue.getAddress())
                .location(issue.getAddress())
                .status(issue.getStatus() != null ? issue.getStatus().name() : "PENDING")
                .severity(issue.getSeverity() != null ? issue.getSeverity().name() : "LOW")
                .latitude(issue.getLatitude())
                .longitude(issue.getLongitude())
                .imageUrl(issue.getImageUrl())
                .aiSummary(issue.getAiSummary())
                .aiExplanation(issue.getAiExplanation())
                .trustScore(issue.getTrustScore())
                .priority(issue.getPriority())
                .tags(issue.getTags())
                .createdAt(issue.getCreatedAt())
                .reporterId(issue.getUser() != null ? issue.getUser().getId() : null)
                .reporterName(issue.getUser() != null ? issue.getUser().getName() : "Anonymous")
                .userName(issue.getUser() != null ? issue.getUser().getName() : "Anonymous")
                .reporterEmail(issue.getUser() != null ? issue.getUser().getEmail() : null)
                .voteCount(upvotes - downvotes)
                .upvoteCount(upvotes)
                .downvoteCount(downvotes)
                .commentCount(commentCount)
                .build();
    }
}