# DecentraVote
# Copyright (C) 2018-2022 iteratec

#MGV Backend Setup

##1. Docker
Für lokales Testen: in den Docker Settings:
>Expose daemon on tcp://localhost:2375 without TLS
    
dao4c\docker\
>docker-compose.yml ausführen
##2. Keycloak :8180
Keycloak startet im Master realm unter port

Username | Passwort
------------ | -------------
admin | Pa55w0rd

Über Master (links oben) klicken und Add realm klicken.

Import: (select file)
>realm.json

Create erstellt den evoting realm und übernimmt alle Einstellungen, außer das Client Secret von dem OIDC Provider.

Muss manuel eingetragen werden unter -> identity provider>OIDC>Client Secret

Falls lokal ohne Cognito getestet werden soll, müssen dafür neue User unter `User/Add user` angelegt werden.
##3. Kotlin :8080
Wenn die solidity contracts schon deployed sind müssen diese noch in Java Klassen migriert werden.

dao4c\solidity
>migrateToJava.bat

führt die nötigen Portierungen durch.

Web3jConfig bearbeiten:

dao4c\oracle\src\main\kotlin\com\iteratec\evoting\oracle\configuration

>Web3jConfig.kt

Hier müssen die mnemonic phrase und die Membership Adresse eingetragen werden.

mnemonic -> ganache

member addr -> findbar in der Membership.java klasse oder in ganache in den contract deployments

##Known Errors
[nio-8080-exec-6] o.k.adapters.OAuthRequestAuthenticator   : failed verification of token: Token is not active

Dieser Fehler tritt auf, wenn der PC/Laptop auf dem Docker läuft nur zugeklappt wird/im Ruhemodus ist. Dadurch bleibt die Zeit im Docker container stehen, nach einer Zeit ist die Zeit so weit verschoben, dass der Refresh-Token nicht angenommen werden.
