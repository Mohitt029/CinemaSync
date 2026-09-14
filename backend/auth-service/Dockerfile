# ---------- Stage 1: Build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# ---------- Stage 2: Runtime ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built JAR (Spring Boot fat jar)
COPY --from=build /app/target/*.jar app.jar

# JVM memory tuning for Render free tier (~512 MB RAM)
# -XX:MaxRAMPercentage=75.0       → keeps heap inside the container limit
# -XX:+ExitOnOutOfMemoryError      → fail fast instead of limping
# -Djava.security.egd=file:/dev/./urandom → faster SecureRandom on Linux
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

# Render injects PORT; Spring Boot reads server.port from application.yml
# Make sure application.yml uses: server.port: ${PORT:8081}
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]