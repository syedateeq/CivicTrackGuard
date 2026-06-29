package com.ateeq.backend.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Entity
@Table(name = "issues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 3000)
    private String description;

    private String category;

    private String department;

    private String address;

    @Enumerated(EnumType.STRING)
    private IssueStatus status;

    @Enumerated(EnumType.STRING)
    private SeverityLevel severity;

    private Double latitude;
    private Double longitude;

    private String imageUrl;

    // AI-generated fields
    @Column(length = 1000)
    private String aiSummary;

    @Column(length = 2000)
    private String aiExplanation;

    private Integer trustScore;

    private LocalDateTime createdAt;

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM votes v WHERE v.issue_id = id AND v.vote_type = 'UPVOTE')")
    private Long upvoteCount;

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM votes v WHERE v.issue_id = id AND v.vote_type = 'DOWNVOTE')")
    private Long downvoteCount;

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM comments c WHERE c.issue_id = id)")
    private Long commentCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}