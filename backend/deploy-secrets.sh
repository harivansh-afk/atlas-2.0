#!/bin/bash

# Script to deploy all environment variables from .env to Fly.io as secrets
# Usage: ./deploy-secrets.sh [app-name]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found in current directory"
    print_info "Please run this script from the backend directory where .env is located"
    exit 1
fi

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    print_error "Fly CLI is not installed"
    print_info "Install it from: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Get app name from argument or prompt user
if [ -n "$1" ]; then
    APP_NAME="$1"
else
    # Try to get app name from fly.toml
    if [ -f "fly.toml" ]; then
        APP_NAME=$(grep -E '^app\s*=' fly.toml | sed 's/app\s*=\s*"\([^"]*\)".*/\1/')
        if [ -n "$APP_NAME" ]; then
            print_info "Found app name in fly.toml: $APP_NAME"
            read -p "Use this app name? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                APP_NAME=""
            fi
        fi
    fi
    
    if [ -z "$APP_NAME" ]; then
        read -p "Enter your Fly.io app name: " APP_NAME
    fi
fi

if [ -z "$APP_NAME" ]; then
    print_error "App name is required"
    exit 1
fi

print_info "Deploying secrets to Fly.io app: $APP_NAME"

# Verify app exists
if ! fly apps list | grep -q "$APP_NAME"; then
    print_error "App '$APP_NAME' not found in your Fly.io account"
    print_info "Available apps:"
    fly apps list
    exit 1
fi

# Read .env file and prepare secrets
print_info "Reading environment variables from .env file..."

# Create temporary file to store processed secrets
TEMP_SECRETS=$(mktemp)
trap "rm -f $TEMP_SECRETS" EXIT

# Process .env file
while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Extract key=value pairs
    if [[ "$line" =~ ^[[:space:]]*([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Trim whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Handle special cases for production deployment
        case "$key" in
            "ENV_MODE")
                value="production"
                print_info "Setting ENV_MODE to production for deployment"
                ;;
            "NEXT_PUBLIC_URL")
                if [[ "$value" == "http://localhost:3000" ]]; then
                    value="https://$APP_NAME.fly.dev"
                    print_info "Setting NEXT_PUBLIC_URL to https://$APP_NAME.fly.dev"
                fi
                ;;
            "REDIS_HOST"|"RABBITMQ_HOST")
                # For Fly.io, these might need to be adjusted based on your setup
                print_warning "Review $key value: $value (may need adjustment for Fly.io)"
                ;;
        esac
        
        # Add to secrets file
        echo "$key=$value" >> "$TEMP_SECRETS"
    fi
done < .env

# Count secrets
SECRET_COUNT=$(wc -l < "$TEMP_SECRETS")
print_info "Found $SECRET_COUNT environment variables to deploy"

# Show what will be deployed (without sensitive values)
print_info "Environment variables to be deployed:"
while IFS= read -r line; do
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Mask sensitive values
        if [[ "$key" =~ (KEY|SECRET|PASSWORD|TOKEN) ]]; then
            if [ ${#value} -gt 0 ]; then
                masked_value="${value:0:4}****"
            else
                masked_value="(empty)"
            fi
            echo "  $key=$masked_value"
        else
            echo "  $key=$value"
        fi
    fi
done < "$TEMP_SECRETS"

# Confirm deployment
echo
read -p "Deploy these secrets to $APP_NAME? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled"
    exit 0
fi

# Deploy secrets
print_info "Deploying secrets to Fly.io..."

# Build the fly secrets set command
FLY_CMD="fly secrets set --app $APP_NAME"

while IFS= read -r line; do
    if [[ -n "$line" ]]; then
        FLY_CMD="$FLY_CMD \"$line\""
    fi
done < "$TEMP_SECRETS"

# Execute the command
print_info "Executing: fly secrets set --app $APP_NAME [secrets...]"
eval "$FLY_CMD"

if [ $? -eq 0 ]; then
    print_success "Successfully deployed $SECRET_COUNT secrets to $APP_NAME"
    print_info "Your app will restart automatically to pick up the new secrets"
else
    print_error "Failed to deploy secrets"
    exit 1
fi

print_success "Deployment complete!"
