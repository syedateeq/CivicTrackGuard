package com.ateeq.backend.service;

import com.ateeq.backend.dto.LeaderboardResponse;
import com.ateeq.backend.model.User;
import com.ateeq.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final UserRepository userRepository;

    public List<LeaderboardResponse> getLeaderboard() {
        List<User> topUsers = userRepository.findTop10ByOrderByPointsDesc();
        List<LeaderboardResponse> leaderboard = new ArrayList<>();

        for (int i = 0; i < topUsers.size(); i++) {
            User user = topUsers.get(i);
            int rank = i + 1;
            leaderboard.add(LeaderboardResponse.builder()
                    .rank(rank)
                    .name(user.getName())
                    .points(user.getPoints() != null ? user.getPoints() : 0)
                    .badge(getBadge(rank, user.getPoints()))
                    .build());
        }
        return leaderboard;
    }

    private String getBadge(int rank, Integer points) {
        if (rank == 1) return "🏆 Civic Champion";
        if (rank == 2) return "🥈 Community Hero";
        if (rank == 3) return "🥉 Local Guardian";
        if (points != null && points >= 100) return "⭐ Active Citizen";
        if (points != null && points >= 50) return "🌱 Rising Contributor";
        return "💚 Contributor";
    }
}