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

# Run with memory-optimized JVM arguments for 512MB RAM constraints:
# - UseSerialGC: much lower footprint than G1GC
# - Xss256k: reduces stack space per thread from 1MB to 256KB
# - MaxMetaspaceSize & ReservedCodeCacheSize: bounds off-heap growth
# - Xms / Xmx: bounds heap memory
CMD ["sh", "-c", "java -XX:+UseSerialGC -Xss256k -XX:MaxMetaspaceSize=80m -XX:ReservedCodeCacheSize=64m -Xms128m -Xmx228m -Dserver.port=${PORT:-8080} -jar app.jar"]
