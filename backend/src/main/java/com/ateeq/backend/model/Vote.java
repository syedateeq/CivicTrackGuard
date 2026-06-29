package com.ateeq.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "votes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String voteType; // UPVOTE or DOWNVOTE

    private LocalDateTime createdAt;

    @ManyToOne
    private User user;

    @ManyToOne
    private Issue issue;
}