package com.ateeq.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public org.springframework.boot.CommandLineRunner seedAdmin(
			com.ateeq.backend.repository.UserRepository userRepository,
			org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
		return args -> {
			if (userRepository.findByEmail("admin@civictrack.com").isEmpty()) {
				com.ateeq.backend.model.User admin = com.ateeq.backend.model.User.builder()
						.name("Admin")
						.email("admin@civictrack.com")
						.password(passwordEncoder.encode("admin"))
						.role("ADMIN")
						.points(0)
						.build();
				userRepository.save(admin);
				System.out.println("Default Admin seeded: admin@civictrack.com / admin");
			}
		};
	}
}
