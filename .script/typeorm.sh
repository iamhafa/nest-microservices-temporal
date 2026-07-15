#!/bin/bash

# ==============================================================================
# TypeORM Migration CLI Wrapper for Monorepo
# ==============================================================================
# This script standardizes and simplifies executing TypeORM CLI commands 
# across multiple microservices in the NestJS monorepo.
#
# Usage:
# pnpm db:generate <service-name> <migration-name>
# pnpm db:run <service-name>
# pnpm db:revert <service-name>
# pnpm db:create <service-name> <migration-name>
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Capture Input Arguments
# ------------------------------------------------------------------------------
COMMAND=$1
SERVICE=$2

# Validate that a service name was provided
if [ -z "$SERVICE" ]; then
  echo "⚠️  Please provide a service name."
  echo "Example: pnpm db:run inventory-service"
  exit 1
fi

# ------------------------------------------------------------------------------
# 2. Service Name Validation
# ------------------------------------------------------------------------------
# List of valid microservices that have an associated database.
# Services like api-gateway or orchestrator-worker are intentionally excluded.
VALID_SERVICES=("order-service" "inventory-service" "payment-service" "shipping-service" "product-service" "user-service")

# Check if the provided service name exists in the allowed array
if [[ ! " ${VALID_SERVICES[@]} " =~ " ${SERVICE} " ]]; then
  echo "❌ Error: Service '$SERVICE' is invalid or does not have a database."
  echo "Valid services include: ${VALID_SERVICES[*]}"
  exit 1
fi

# ------------------------------------------------------------------------------
# 3. Path Configurations
# ------------------------------------------------------------------------------
# Define the paths to the environment and TypeORM data source files dynamically
ENV_FILE="apps/$SERVICE/.env"
DATA_SOURCE="apps/$SERVICE/src/database/config/data-source.ts"

# Validate that the environment file exists before attempting to read it
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: Environment configuration file not found at $ENV_FILE"
  exit 1
fi

# Validate that the data source configuration file exists for the TypeORM CLI
if [ ! -f "$DATA_SOURCE" ]; then
  echo "❌ Error: DataSource configuration not found at $DATA_SOURCE"
  exit 1
fi

# ------------------------------------------------------------------------------
# 4. Inject Environment Variables
# ------------------------------------------------------------------------------
# TypeORM CLI runs completely isolated from the NestJS context, meaning it 
# won't automatically load NestJS ConfigModule variables. We must manually 
# load and export the variables from the local .env file so the TypeORM CLI 
# can establish a database connection successfully.
export $(grep -v '^#' "$ENV_FILE" | xargs)

# ------------------------------------------------------------------------------
# 5. Execute TypeORM Command
# ------------------------------------------------------------------------------
# Execute the requested TypeORM command using the dynamic data source path
case "$COMMAND" in
  generate)
    # Autogenerates a new migration file containing SQL queries to update the DB
    # schema based on the differences between the current DB state and the Entity.
    MIGRATION_NAME=$3
    if [ -z "$MIGRATION_NAME" ]; then
      echo "⚠️  Please provide a migration name to generate."
      echo "Example: pnpm db:generate inventory-service InitTable"
      exit 1
    fi
    pnpm typeorm-ts-node-commonjs migration:generate -d "$DATA_SOURCE" "apps/$SERVICE/src/database/migration/$MIGRATION_NAME"
    ;;
    
  run)
    # Executes all pending migrations to apply schema changes to the database
    pnpm typeorm-ts-node-commonjs migration:run -d "$DATA_SOURCE"
    ;;
    
  revert)
    # Reverts the most recently executed migration
    pnpm typeorm-ts-node-commonjs migration:revert -d "$DATA_SOURCE"
    ;;
    
  create)
    # Creates a blank migration file so developers can write custom raw SQL queries
    MIGRATION_NAME=$3
    if [ -z "$MIGRATION_NAME" ]; then
      echo "⚠️  Please provide an empty migration name to create."
      echo "Example: pnpm db:create inventory-service ManualMigration"
      exit 1
    fi
    pnpm typeorm-ts-node-commonjs migration:create "apps/$SERVICE/src/database/migration/$MIGRATION_NAME"
    ;;
    
  *)
    # Fallback error for unrecognized commands
    echo "❌ Error: Invalid command '$COMMAND'. Supported commands: generate | run | revert | create"
    exit 1
    ;;
esac
