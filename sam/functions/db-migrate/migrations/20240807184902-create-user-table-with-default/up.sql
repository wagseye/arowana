CREATE TABLE users (
  id               text PRIMARY KEY,
  username         text NOT NULL,
  email            text,
  organization_id  text NOT NULL,
  created_by       text,
  created_at       timestamp with time zone NOT NULL DEFAULT now(),
  last_modified_by text,
  last_modified_at timestamp with time zone,
  deactivated_at   timestamp with time zone
);
ALTER TABLE users ADD CONSTRAINT fk_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON UPDATE CASCADE;
ALTER TABLE users ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE users ADD CONSTRAINT fk_last_modified_by FOREIGN KEY (last_modified_by) REFERENCES users(id);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);

-- Create a user for the admin organization
INSERT INTO users (id, username, organization_id, email)
    VALUES ('temp_user_id', 'admin', 'temp_org_id', 'wagseye@gmail.com');
