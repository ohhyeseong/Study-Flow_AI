# Build
FROM gradle:8-jdk21 AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew
RUN ./gradlew build -x test

# Run
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*[!plain].jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
