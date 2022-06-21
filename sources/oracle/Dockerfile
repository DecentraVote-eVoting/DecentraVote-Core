FROM openjdk:13-alpine
COPY target/oracle-1.1.0.jar /app/oracle.jar
WORKDIR /app
CMD ["/opt/openjdk-13/bin/java", "-jar",  "/app/oracle.jar"]

