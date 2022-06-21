-- data_entry definition

-- Drop table

-- DROP TABLE data_entry;

CREATE TABLE data_entry (
                            hash varchar(255) NOT NULL,
                            "data" text NULL,
                            public bool NULL,
                            CONSTRAINT data_entry_pkey PRIMARY KEY (hash)
);
