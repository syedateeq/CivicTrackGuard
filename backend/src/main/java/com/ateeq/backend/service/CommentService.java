package com.ateeq.backend.service;

import com.ateeq.backend.dto.CommentRequest;
import com.ateeq.backend.dto.CommentResponse;
import com.ateeq.backend.exception.ResourceNotFoundException;
import com.ateeq.backend.model.Comment;
import com.ateeq.backend.model.Issue;
import com.ateeq.backend.model.User;
import com.ateeq.backend.repository.CommentRepository;
import com.ateeq.backend.repository.IssueRepository;
import com.ateeq.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final IssueRepository issueRepository;

    public CommentResponse addComment(CommentRequest request) {
        // Get user from JWT context
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Issue issue = issueRepository.findById(request.getIssueId())
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        Comment comment = Comment.builder()
                .text(request.getText())
                .user(user)
                .issue(issue)
                .createdAt(LocalDateTime.now())
                .build();

        Comment saved = commentRepository.save(comment);

        // Points for engagement
        user.setPoints(user.getPoints() + 2);
        userRepository.save(user);

        return toResponse(saved);
    }

    public List<CommentResponse> getCommentsByIssue(Long issueId) {
        return commentRepository.findByIssueId(issueId)
                .stream().map(this::toResponse).toList();
    }

    private CommentResponse toResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .text(comment.getText())
                .createdAt(comment.getCreatedAt())
                .authorId(comment.getUser() != null ? comment.getUser().getId() : null)
                .authorName(comment.getUser() != null ? comment.getUser().getName() : "Anonymous")
                .build();
    }
}