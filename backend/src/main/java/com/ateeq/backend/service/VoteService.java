package com.ateeq.backend.service;

import com.ateeq.backend.dto.VoteRequest;
import com.ateeq.backend.exception.ResourceNotFoundException;
import com.ateeq.backend.model.Issue;
import com.ateeq.backend.model.User;
import com.ateeq.backend.model.Vote;
import com.ateeq.backend.repository.IssueRepository;
import com.ateeq.backend.repository.UserRepository;
import com.ateeq.backend.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class VoteService {

    private final VoteRepository voteRepository;
    private final UserRepository userRepository;
    private final IssueRepository issueRepository;

    public Vote addVote(VoteRequest request) {
        // Resolve user from JWT security context — userId in request body is optional/ignored
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        if (request.getIssueId() == null) {
            throw new ResourceNotFoundException("issueId must not be null");
        }
        Issue issue = issueRepository.findById(request.getIssueId())
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        Vote vote = Vote.builder()
                .voteType(request.getVoteType())
                .user(user)
                .issue(issue)
                .createdAt(LocalDateTime.now())
                .build();

        if ("UPVOTE".equalsIgnoreCase(request.getVoteType())) {
            User reporter = issue.getUser();
            if (reporter != null) {
                reporter.setPoints(reporter.getPoints() + 2);
                userRepository.save(reporter);
            }
        }

        return voteRepository.save(vote);
    }
    public long getVoteCount(Long issueId) {
        long upvotes = voteRepository.countByIssueIdAndVoteType(issueId, "UPVOTE");
        long downvotes = voteRepository.countByIssueIdAndVoteType(issueId, "DOWNVOTE");

        return upvotes - downvotes;
    }
}