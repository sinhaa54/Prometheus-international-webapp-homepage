"""
Database client abstractions for the Prometheus Homepage backend.

Supports two providers:
  - dataiku   → DataikuDatabaseClient  (runs inside Dataiku DSS code environments)
  - snowflake → SnowflakeClient        (direct connection, private-key or external-browser auth)

The factory accepts an explicit (provider, config) pair so no YAML file is
required; configuration is supplied by DataikuConfig (see dataiku_config.py).
"""
from __future__ import annotations

from abc import ABC, abstractmethod
import logging
import time

import pandas as pd

logger = logging.getLogger(__name__)
timing_logger = logging.getLogger("app.timing")


class DatabaseClient(ABC):
    @abstractmethod
    def get_dataframe(self, dataset_name: str) -> pd.DataFrame:
        raise NotImplementedError()

    @abstractmethod
    def write_dataframe(self, df: pd.DataFrame, table_name: str):
        raise NotImplementedError()

    @abstractmethod
    def get_schema(self, table_name: str):
        raise NotImplementedError()

    @abstractmethod
    def update_dataframe(self, df: pd.DataFrame, table_name: str, key_columns: list):
        raise NotImplementedError()

    @abstractmethod
    def execute_query_to_df(self, query: str) -> pd.DataFrame:
        raise NotImplementedError()

    def execute_sql_query(self, query: str):
        """Execute DDL / DML (CREATE, UPDATE, DELETE, …). Override when supported."""
        raise NotImplementedError()

    def make_dataset_instance(self, new_table_name: str) -> str:
        raise NotImplementedError()


# ---------------------------------------------------------------------------
# Dataiku provider
# ---------------------------------------------------------------------------

class DataikuDatabaseClient(DatabaseClient):
    """
    Wraps the Dataiku Python SDK (dataiku + dataikuapi).

    Config keys expected:
        PROJECT_KEY       – DSS project key (str)
        CONNECTION_NAME   – Named Snowflake connection in DSS (str)
        DATABASE_NAME     – Snowflake database (str, used by make_dataset_instance)
        SCHEMA_NAME       – Snowflake schema  (str, used by make_dataset_instance)
    """

    def __init__(self, config: dict):
        import dataiku
        from dataiku.core.sql import SQLExecutor2

        _t0 = time.perf_counter()
        self.client = dataiku.api_client()
        _t_api = time.perf_counter()
        self.project = self.client.get_project(config["PROJECT_KEY"])
        _t_proj = time.perf_counter()
        self.connection_name = config.get("CONNECTION_NAME")
        self.project_key = config.get("PROJECT_KEY")
        self.SQLExecutor2 = SQLExecutor2
        self.database = config.get("DATABASE_NAME")
        self.schema = config.get("SCHEMA_NAME")
        timing_logger.info(
            "DATAIKU INIT connection='%s' api_client=%.1fms get_project=%.1fms total=%.1fms",
            self.connection_name,
            (_t_api - _t0) * 1000,
            (_t_proj - _t_api) * 1000,
            (_t_proj - _t0) * 1000,
        )

    def get_dataframe(self, dataset_name: str) -> pd.DataFrame:
        dataset = self.project.get_dataset(dataset_name)
        return dataset.get_dataframe()

    def write_dataframe(self, df: pd.DataFrame, dataset_name: str):
        """Write a DataFrame to a Dataiku dataset (overwrites / appends per DSS policy)."""
        dataset = self.project.get_dataset(dataset_name)
        dataset.write_with_schema(df)

    def get_schema(self, dataset_name: str):
        dataset = self.project.get_dataset(dataset_name)
        schema = dataset.get_schema()
        return [
            {
                "name": col.get("name"),
                "description": col.get("comment"),
                "data type": col.get("type"),
            }
            for col in schema.get("columns", [])
        ]

    def update_dataframe(self, df: pd.DataFrame, dataset_name: str, key_columns: list):
        # Dataiku normally rewrites the full dataset.
        self.write_dataframe(df, dataset_name)

    def execute_query_to_df(self, query: str) -> pd.DataFrame:
        """Run a SQL query against the named Snowflake connection and return a DataFrame."""
        _t0 = time.perf_counter()
        executor = self.SQLExecutor2(connection=self.connection_name)
        _t_exec = time.perf_counter()
        df = executor.query_to_df(query)
        _t_query = time.perf_counter()

        row_count = 0 if df is None else len(df)
        if df is not None and not df.empty:
            df = df.astype(object)
            df = df.where(pd.notna(df), None)
        _t_post = time.perf_counter()

        timing_logger.info(
            "DATAIKU QUERY connection='%s' executor_init=%.1fms query_to_df=%.1fms "
            "postprocess=%.1fms total=%.1fms rows=%d",
            self.connection_name,
            (_t_exec - _t0) * 1000,
            (_t_query - _t_exec) * 1000,
            (_t_post - _t_query) * 1000,
            (_t_post - _t0) * 1000,
            row_count,
        )
        return df

    def execute_sql_query(self, query: str):
        response = self.client.sql_query(
            query=query,
            connection=self.connection_name,
            post_queries=["COMMIT"],
            project_key=self.project_key,
        )
        return response

    def make_dataset_instance(self, new_table_name: str) -> str:
        try:
            full_table_path = f"{self.database}.{self.schema}.{new_table_name}"
            try:
                from dataikuapi.utils import DataikuException
            except Exception:
                DataikuException = Exception

            try:
                self.project.create_dataset(
                    new_table_name,
                    type="Snowflake",
                    params={
                        "connection": self.connection_name,
                        "table": full_table_path,
                        "mode": "table",
                        "tableMode": "table",
                    },
                )
            except DataikuException:
                pass  # dataset likely already exists

            dss_dataset = self.project.get_dataset(new_table_name)
            definition = dss_dataset.get_definition()
            if definition.get("managed") is not True:
                definition["managed"] = True
                dss_dataset.set_definition(definition)

            settings = dss_dataset.get_settings()
            settings.set_table(self.connection_name, self.schema, new_table_name)
            settings.save()
            return f"{new_table_name} has been created/updated in Dataiku successfully"
        except Exception as e:
            return f"Failed to create/update dataset {new_table_name}: {e}"


# ---------------------------------------------------------------------------
# Snowflake direct provider
# ---------------------------------------------------------------------------

class SnowflakeClient(DatabaseClient):
    """
    Direct Snowflake connector. Supports private-key and external-browser auth.

    Config keys expected:
        USER, ACCOUNT, WAREHOUSE, DATABASE, SCHEMA, ROLE
        SNOWFLAKE_PRIVATE_KEY  – PEM string  (when not using externalbrowser)
        AUTHENTICATOR          – set to "externalbrowser" for SSO
    """

    def __init__(self, config: dict = {}):
        import snowflake.connector
        self.snowflake_connector = snowflake.connector

        authenticator = config.get("AUTHENTICATOR")
        private_key_str = config.get("SNOWFLAKE_PRIVATE_KEY")

        if authenticator and authenticator.lower() == "externalbrowser":
            self.connection_params = {
                "user": config.get("USER"),
                "account": config.get("ACCOUNT"),
                "authenticator": "externalbrowser",
                "warehouse": config.get("WAREHOUSE"),
                "database": config.get("DATABASE"),
                "schema": config.get("SCHEMA"),
                "role": config.get("ROLE"),
                "client_session_keep_alive": True,
            }
        else:
            from cryptography.hazmat.primitives import serialization

            private_key_str = (private_key_str or "").replace("  ", "\n").strip()
            key_data = private_key_str.encode("utf-8")
            p_key = serialization.load_pem_private_key(key_data, password=None)
            private_key_bytes = p_key.private_bytes(
                encoding=serialization.Encoding.DER,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            )
            self.connection_params = {
                "user": config.get("USER"),
                "private_key": private_key_bytes,
                "account": config.get("ACCOUNT"),
                "warehouse": config.get("WAREHOUSE"),
                "database": config.get("DATABASE"),
                "role": config.get("ROLE"),
                "client_session_keep_alive": True,
            }

        _t0 = time.perf_counter()
        self.conn = snowflake.connector.connect(**self.connection_params)
        timing_logger.info(
            "SNOWFLAKE CONNECT account='%s' warehouse='%s' connect=%.1fms",
            self.connection_params.get("account"),
            self.connection_params.get("warehouse"),
            (time.perf_counter() - _t0) * 1000,
        )

    def _get_cursor(self):
        return self.conn.cursor()

    def get_dataframe(self, dataset_name: str) -> pd.DataFrame:
        cur = self._get_cursor()
        try:
            cur.execute(f"SELECT * FROM {dataset_name}")
            return cur.fetch_pandas_all()
        finally:
            cur.close()

    def write_dataframe(self, df: pd.DataFrame, table_name: str):
        try:
            from snowflake.connector.pandas_tools import write_pandas
            success, nchunks, nrows, _ = write_pandas(self.conn, df, table_name)
            if not success:
                raise RuntimeError("write_pandas failed")
            return {"rows_written": nrows, "chunks": nchunks}
        except Exception:
            cur = self._get_cursor()
            try:
                cols = ",".join([f'"{c}"' for c in df.columns])
                for _, row in df.iterrows():
                    vals = []
                    for x in row:
                        if x is None:
                            vals.append("NULL")
                        else:
                            s = str(x).replace("'", "''")
                            vals.append(f"'{s}'")
                    cur.execute(f"INSERT INTO {table_name} ({cols}) VALUES ({','.join(vals)})")
                try:
                    self.conn.commit()
                except Exception:
                    pass
            finally:
                cur.close()
            return {"rows_written": len(df)}

    def get_schema(self, table_name: str):
        cur = self._get_cursor()
        try:
            cur.execute(f"DESC TABLE {table_name}")
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description] if cur.description else []
            name_idx = cols.index("name") if "name" in cols else 0
            type_idx = cols.index("type") if "type" in cols else 1
            comment_idx = cols.index("comment") if "comment" in cols else (
                cols.index("description") if "description" in cols else None
            )
            return [
                {
                    "name": r[name_idx],
                    "description": r[comment_idx] if comment_idx is not None and len(r) > comment_idx else "",
                    "data type": r[type_idx] if len(r) > type_idx else "",
                }
                for r in rows
            ]
        finally:
            cur.close()

    def update_dataframe(self, df: pd.DataFrame, table_name: str, key_columns: list):
        cur = self._get_cursor()
        try:
            for _, row in df.iterrows():
                set_clause = ", ".join(
                    [f"{col}='{str(row[col])}'" for col in df.columns if col not in key_columns]
                )
                where_clause = " AND ".join([f"{col}='{str(row[col])}'" for col in key_columns])
                cur.execute(f"UPDATE {table_name} SET {set_clause} WHERE {where_clause}")
        finally:
            cur.close()

    def execute_query_to_df(self, query: str) -> pd.DataFrame:
        cur = self._get_cursor()
        try:
            _t0 = time.perf_counter()
            cur.execute(query)
            _t_exec = time.perf_counter()
            df = cur.fetch_pandas_all()
            _t_fetch = time.perf_counter()
            row_count = 0 if df is None else len(df)
            if df is not None and not df.empty:
                df = df.astype(object)
                df = df.where(pd.notna(df), None)
            _t_post = time.perf_counter()
            timing_logger.info(
                "SNOWFLAKE QUERY execute=%.1fms fetch=%.1fms postprocess=%.1fms total=%.1fms rows=%d",
                (_t_exec - _t0) * 1000,
                (_t_fetch - _t_exec) * 1000,
                (_t_post - _t_fetch) * 1000,
                (_t_post - _t0) * 1000,
                row_count,
            )
            return df
        finally:
            cur.close()

    def execute_sql_query(self, query: str):
        cur = self._get_cursor()
        try:
            cur.execute(query)
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            raise e
        finally:
            cur.close()

    def make_dataset_instance(self, new_table_name: str) -> str:
        cur = None
        try:
            cur = self._get_cursor()
            try:
                cur.execute(f"SELECT 1 FROM {new_table_name} LIMIT 1")
                return f"Snowflake table {new_table_name} appears to exist."
            except Exception:
                return f"Snowflake table {new_table_name} does not exist or not accessible."
        finally:
            if cur is not None:
                try:
                    cur.close()
                except Exception:
                    pass


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

class DatabaseClientFactory:
    """Create a DatabaseClient instance from an explicit (provider, config) pair."""

    _client_map: dict = {
        "dataiku": DataikuDatabaseClient,
        "snowflake": SnowflakeClient,
    }

    @staticmethod
    def get_client(provider: str, config: dict) -> DatabaseClient:
        client_cls = DatabaseClientFactory._client_map.get(provider.lower())
        if not client_cls:
            raise ValueError(f"Unsupported database provider: '{provider}'. "
                             f"Supported: {list(DatabaseClientFactory._client_map)}")
        return client_cls(config)
