

-- DROP SEQUENCE import_user_seq;

CREATE SEQUENCE import_user_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 1
	CACHE 1
	NO CYCLE;


-- DROP SEQUENCE mnemonic_seq;

CREATE SEQUENCE mnemonic_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 1
	CACHE 1
	NO CYCLE;-- account_entity definition

-- Drop table

-- DROP TABLE account_entity;

CREATE TABLE account_entity (
                                id varchar(255) NOT NULL,
                                address varchar(255) NULL,
                                membership_claim varchar(255) NULL,
                                "role" int4 NULL,
                                CONSTRAINT account_entity_pkey PRIMARY KEY (id)
);


-- import_user definition

-- Drop table

-- DROP TABLE import_user;

CREATE TABLE import_user (
                             id int8 NOT NULL,
                             access_code varchar(255) NULL,
                             uid varchar(255) NULL,
                             name1 varchar(255) NULL,
                             name2 varchar(255) NULL,
                             "role" int4 NULL,
                             used bool NULL,
                             valid_until timestamp NULL,
                             CONSTRAINT import_user_pkey PRIMARY KEY (id),
                             CONSTRAINT field_0_unique UNIQUE (uid)
);


-- mnemonic_entity definition

-- Drop table

-- DROP TABLE mnemonic_entity;

CREATE TABLE mnemonic_entity (
                                 id int8 NOT NULL,
                                 address varchar(255) NULL,
                                 encrypted_mnemonic varchar(255) NULL,
                                 "password" varchar(255) NULL,
                                 username varchar(255) NULL,
                                 CONSTRAINT mnemonic_entity_pkey PRIMARY KEY (id)
);
