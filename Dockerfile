# Build
FROM gradle:8-jdk21 AS build
WORKDIR /app
COPY . .
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
RUN chmod +x gradlew
RUN ./gradlew build -x test

# Run
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/study-flow-server-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
