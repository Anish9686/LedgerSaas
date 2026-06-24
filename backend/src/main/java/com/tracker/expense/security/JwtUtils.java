package com.tracker.expense.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtils {

    // A base64-encoded 256-bit key used as a persistent fallback
    private static final String DEFAULT_SECRET_BASE64 = "Ynkgc2VjdXJlIGtleSBmb3IgaG1hYy1zaGEyNTYgc2VjcmV0IGtleSBtdXN0IGJlIDI1NiBiaXRz";

    private final Key key;
    
    // Token valid for 24 hours
    private final long EXPIRATION_TIME = 1000 * 60 * 60 * 24; 

    public JwtUtils(@org.springframework.beans.factory.annotation.Value("${jwt.secret:}") String jwtSecret) {
        String secretToUse = (jwtSecret != null && !jwtSecret.trim().isEmpty()) ? jwtSecret : DEFAULT_SECRET_BASE64;
        byte[] keyBytes;
        try {
            // Attempt to decode as base64 first
            keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(secretToUse);
            if (keyBytes.length < 32) {
                keyBytes = secretToUse.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            }
        } catch (IllegalArgumentException e) {
            // Fallback to raw bytes of the secret string
            keyBytes = secretToUse.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
        
        // Ensure key length is at least 32 bytes for HS256
        if (keyBytes.length < 32) {
            try {
                java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                keyBytes = digest.digest(keyBytes);
            } catch (java.security.NoSuchAlgorithmException ex) {
                // Standard SHA-256 always available in JVM
            }
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
