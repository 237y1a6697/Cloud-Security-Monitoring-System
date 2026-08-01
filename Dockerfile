# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# Copy Maven wrapper and POM first (layer cache: only rebuild if pom.xml changes)
COPY mvnw mvnw.cmd ./
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies (cached unless pom.xml changes)
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Copy source and build
COPY src src
RUN ./mvnw clean package -DskipTests -q

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/target/dashboard-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

# Use shell form so ${PORT} is expanded at runtime by Render
CMD ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
