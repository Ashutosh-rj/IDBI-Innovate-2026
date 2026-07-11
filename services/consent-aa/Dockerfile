# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy ONLY pom.xml files first to cache dependency downloads across all Spring services
COPY pom.xml .
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY consent-aa/pom.xml consent-aa/pom.xml
COPY health-card/pom.xml health-card/pom.xml
COPY ingestion/pom.xml ingestion/pom.xml
COPY msme-registry/pom.xml msme-registry/pom.xml

# Pre-fetch plugins and dependencies in parallel (-T 1C)
RUN --mount=type=cache,target=/root/.m2/repository mvn dependency:go-offline -B -T 1C --no-transfer-progress || true

# Copy ONLY consent-aa source code and compile in parallel
COPY consent-aa/src consent-aa/src
RUN --mount=type=cache,target=/root/.m2/repository mvn package -pl consent-aa -am -DskipTests -T 1C --no-transfer-progress -Dmaven.javadoc.skip=true

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/consent-aa/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
