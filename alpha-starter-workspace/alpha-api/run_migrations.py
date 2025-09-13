from __future__ import annotations

import os
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def run_upgrade_head():
    here = os.path.dirname(__file__)
    ini_path = os.path.join(here, 'alembic.ini')
    if os.path.exists(ini_path):
        cfg = Config(ini_path)
    else:
        # Fallback: configure programmatically
        cfg = Config()
    # Ensure script_location is always set explicitly
    cfg.set_main_option('script_location', os.path.join(here, 'migrations'))
    # Prefer env DATABASE_URL
    db_url = os.getenv('DATABASE_URL')
    if db_url:
        cfg.set_main_option('sqlalchemy.url', db_url)
    else:
        db_url = cfg.get_main_option('sqlalchemy.url')

    # If DB already has tables (e.g., created via create_all), stamp head to avoid duplicate CREATE TABLE
    try:
        if db_url:
            engine = create_engine(db_url)
            insp = inspect(engine)
            tables = set(insp.get_table_names())
            has_alembic = 'alembic_version' in tables
            has_core = 'users' in tables  # proxy for baseline schema presence
            if not has_alembic and has_core:
                command.stamp(cfg, 'head')
                return
    except Exception:
        # Fall back to upgrade attempt
        pass
    # Default: apply migrations
    command.upgrade(cfg, 'head')


if __name__ == '__main__':
    run_upgrade_head()
