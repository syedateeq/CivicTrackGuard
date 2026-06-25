package com.ateeq.backend.repository;

import com.ateeq.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    long count();
    List<User> findTop10ByOrderByPointsDesc();
}