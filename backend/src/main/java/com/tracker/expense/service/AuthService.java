package com.tracker.expense.service;

import com.tracker.expense.dto.AuthRequest;
import com.tracker.expense.dto.AuthResponse;
import com.tracker.expense.dto.RegisterRequest;
import com.tracker.expense.entity.User;
import com.tracker.expense.repository.UserRepository;
import com.tracker.expense.security.JwtUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtUtils jwtUtils,
                       UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    public String register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Create new user's account and encode password
        User user = new User(request.getUsername(), request.getEmail(),
                             passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        return "User registered successfully!";
    }

    public AuthResponse login(AuthRequest request) {
        // Authenticate the user credentials and get authentication object
        org.springframework.security.core.Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // Fetch UserDetails directly from authentication result (no second DB query)
        final UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        final String token = jwtUtils.generateToken(userDetails);

        return new AuthResponse(token, userDetails.getUsername());
    }
}
