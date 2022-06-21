-- DROP SEQUENCE anonymous_ballot_seq;

CREATE SEQUENCE anonymous_ballot_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE open_ballot_seq;

CREATE SEQUENCE open_ballot_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE retry_seq;

CREATE SEQUENCE retry_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 1
	CACHE 1
	NO CYCLE;-- t_anonymous_ballot definition

-- Drop table

-- DROP TABLE t_anonymous_ballot;

CREATE TABLE t_anonymous_ballot (
                                    ballot_id int8 NOT NULL,
                                    decision_json text NULL,
                                    decision_signature varchar(255) NULL,
                                    decision_signer varchar(255) NULL,
                                    vote_address varchar(255) NULL,
                                    zk_anon_address varchar(255) NULL,
                                    zk_index varchar(255) NULL,
                                    zk_nullifier varchar(255) NULL,
                                    zk_proof_json text NULL,
                                    zk_root varchar(255) NULL,
                                    CONSTRAINT t_anonymous_ballot_pkey PRIMARY KEY (ballot_id),
                                    CONSTRAINT vote_address_nullifier_unique UNIQUE (vote_address, zk_nullifier)
);


-- t_open_ballot definition

-- Drop table

-- DROP TABLE t_open_ballot;

CREATE TABLE t_open_ballot (
                               ballot_id int8 NOT NULL,
                               decision_json text NULL,
                               decision_signature varchar(255) NULL,
                               decision_signer varchar(255) NULL,
                               nullifier_json text NULL,
                               nullifier_signature varchar(255) NULL,
                               nullifier_signer varchar(255) NULL,
                               vote_address varchar(255) NULL,
                               CONSTRAINT t_open_ballot_pkey PRIMARY KEY (ballot_id),
                               CONSTRAINT vote_address_nullifier_json_unique UNIQUE (vote_address, nullifier_json)
);


-- t_retry definition

-- Drop table

-- DROP TABLE t_retry;

CREATE TABLE t_retry (
                         id int8 NOT NULL,
                         anonymous_vote bool NOT NULL,
                         vote_address varchar(255) NULL,
                         CONSTRAINT t_retry_pkey PRIMARY KEY (id)
);
