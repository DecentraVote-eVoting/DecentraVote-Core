FROM openjdk:13-alpine
COPY target/ballotbox-1.1.0.jar /app/ballotbox.jar
WORKDIR /app
CMD ["/opt/openjdk-13/bin/java", "-jar",  "/app/ballotbox.jar"]
