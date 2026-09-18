"""
Adapter that builds a provider-specific config dict from Dataiku project
variables and returns a DatabaseClient via DatabaseClientFactory.
"""
from __future__ import annotations

from .db_client import DatabaseClientFactory


def get_provider_config(provider_name: str, project_variables: dict) -> dict:
    """
    Map Prometheus DSS project variables to the config dict expected by
    each DatabaseClient constructor.

    Prometheus project variable names:
        PROJECT_KEY               – DSS project key
        SNOWFLAKE_CONNECTION_NAME – Named Snowflake connection in DSS
        database                  – Snowflake database
        schema                    – Snowflake schema
        USER                      – Snowflake service-account username   (snowflake provider only)
        SNOWFLAKE_PRIVATE_KEY     – PEM private key string               (snowflake provider only)
        ACCOUNT                   – Snowflake account identifier         (snowflake provider only)
        WAREHOUSE                 – Snowflake virtual warehouse          (snowflake provider only)
        ROLE                      – Snowflake role                       (snowflake provider only)
        AUTHENTICATOR             – e.g. "externalbrowser"               (snowflake provider only)
    """
    provider_name = provider_name.lower()

    if provider_name == "dataiku":
        return {
            "PROJECT_KEY":     project_variables.get("PROJECT_KEY"),
            "CONNECTION_NAME": project_variables.get("SNOWFLAKE_CONNECTION_NAME"),
            "DATABASE_NAME":   project_variables.get("database"),
            "SCHEMA_NAME":     project_variables.get("schema"),
        }

    if provider_name == "snowflake":
        return {
            "USER":                 project_variables.get("USER"),
            "SNOWFLAKE_PRIVATE_KEY": project_variables.get("SNOWFLAKE_PRIVATE_KEY"),
            "ACCOUNT":              project_variables.get("ACCOUNT"),
            "WAREHOUSE":            project_variables.get("WAREHOUSE"),
            "DATABASE":             project_variables.get("database") or project_variables.get("DATABASE"),
            "SCHEMA":               project_variables.get("schema") or project_variables.get("SCHEMA"),
            "ROLE":                 project_variables.get("ROLE"),
            "AUTHENTICATOR":        project_variables.get("AUTHENTICATOR"),
        }

    raise ValueError(f"Unknown provider: '{provider_name}'. Supported: 'dataiku', 'snowflake'.")


def create_db_client(provider: str, project_variables: dict):
    """Build a DatabaseClient from a provider name and DSS project variables."""
    cfg = get_provider_config(provider, project_variables)
    return DatabaseClientFactory.get_client(provider=provider, config=cfg)
