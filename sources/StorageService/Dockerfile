FROM openjdk:13-alpine
COPY target/storageservice-1.0.0.jar /app/storageservice.jar
WORKDIR /app
CMD ["/opt/openjdk-13/bin/java", "-jar",  "/app/storageservice.jar"]
