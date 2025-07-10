#!/bin/bash

# Script to replace "platform" with "app" throughout the codebase
# This script will handle various patterns and contexts where "platform" appears

set -e  # Exit on any error

echo "🔄 Starting platform -> app replacement script..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
total_files=0
total_replacements=0

# Function to print colored output
print_status() {
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

# Function to count occurrences in a file
count_occurrences() {
    local file="$1"
    local pattern="$2"
    grep -o "$pattern" "$file" 2>/dev/null | wc -l
}

# Function to replace patterns in a file
replace_in_file() {
    local file="$1"
    local old_pattern="$2"
    local new_pattern="$3"
    local description="$4"
    
    if [[ -f "$file" ]]; then
        local count=$(count_occurrences "$file" "$old_pattern")
        if [[ $count -gt 0 ]]; then
            print_status "Processing $file - $description ($count occurrences)"
            sed -i "s|$old_pattern|$new_pattern|g" "$file"
            total_replacements=$((total_replacements + count))
            total_files=$((total_files + 1))
        fi
    fi
}

# Function to process files with specific patterns
process_files() {
    local pattern="$1"
    local old_text="$2"
    local new_text="$3"
    local description="$4"
    
    print_status "🔍 Searching for files with pattern: $pattern"
    
    # Use find to get files, then process each one
    find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" \) \
        -not -path "./node_modules/*" \
        -not -path "./.git/*" \
        -not -path "./dist/*" \
        -not -path "./build/*" \
        -not -path "./.next/*" \
        -print0 | while IFS= read -r -d '' file; do
        
        if grep -q "$pattern" "$file" 2>/dev/null; then
            replace_in_file "$file" "$old_text" "$new_text" "$description"
        fi
    done
}

print_status "🚀 Starting comprehensive platform -> app replacement"
print_status "Working directory: $(pwd)"

# 1. Replace href="/platform" with href="/app"
print_status "📝 Step 1: Replacing href attributes"
process_files 'href=["\047]/platform' 'href="/platform' 'href="/app' "href attributes"
process_files "href=['\"]\/platform" "href='/platform" "href='/app" "href attributes (single quotes)"

# 2. Replace router.push("/platform") with router.push("/app")
print_status "📝 Step 2: Replacing router.push calls"
process_files 'router\.push\(["\047]/platform' 'router.push("/platform' 'router.push("/app' "router.push calls"
process_files "router\.push\(['\"]\/platform" "router.push('/platform" "router.push('/app" "router.push calls (single quotes)"

# 3. Replace redirect("/platform") with redirect("/app")
print_status "📝 Step 3: Replacing redirect calls"
process_files 'redirect\(["\047]/platform' 'redirect("/platform' 'redirect("/app' "redirect calls"
process_files "redirect\(['\"]\/platform" "redirect('/platform" "redirect('/app" "redirect calls (single quotes)"

# 4. Replace revalidatePath("/platform") with revalidatePath("/app")
print_status "📝 Step 4: Replacing revalidatePath calls"
process_files 'revalidatePath\(["\047]/platform' 'revalidatePath("/platform' 'revalidatePath("/app' "revalidatePath calls"
process_files "revalidatePath\(['\"]\/platform" "revalidatePath('/platform" "revalidatePath('/app" "revalidatePath calls (single quotes)"

# 5. Replace "/platform/" in strings (be careful with this one)
print_status "📝 Step 5: Replacing string literals containing /platform/"
process_files '["\047]/platform/' '"/platform/' '"/app/' "string literals with /platform/"
process_files "['\"]\/platform\/" "'/platform/" "'/app/" "string literals with /platform/ (single quotes)"

# 6. Replace pathname.startsWith('/platform') patterns
print_status "📝 Step 6: Replacing pathname checks"
process_files "startsWith\(['\"]\/platform" "startsWith('/platform" "startsWith('/app" "pathname.startsWith calls"
process_files 'startsWith\(["\047]/platform' 'startsWith("/platform' 'startsWith("/app' "pathname.startsWith calls"

# 7. Replace pathname.includes('platform') patterns
print_status "📝 Step 7: Replacing pathname includes"
process_files "includes\(['\"]platform" "includes('platform" "includes('app" "pathname.includes calls"
process_files 'includes\(["\047]platform' 'includes("platform' 'includes("app' "pathname.includes calls"

# 8. Replace matcher patterns in middleware
print_status "📝 Step 8: Replacing middleware patterns"
process_files '/platform\(\.\*\)' '/platform(.*)' '/app(.*)' "middleware matchers"

# 9. Replace any remaining standalone /platform references
print_status "📝 Step 9: Replacing remaining /platform references"
process_files '["\047]/platform["\047]' '"/platform"' '"/app"' "quoted /platform strings"
process_files "['\"]\/platform['\"]" "'/platform'" "'/app'" "quoted /platform strings (single quotes)"

# 10. Replace template literals with /platform
print_status "📝 Step 10: Replacing template literals"
process_files '`[^`]*/platform[^`]*`' '/platform' '/app' "template literals"

# 11. Handle any URL construction patterns
print_status "📝 Step 11: Replacing URL construction patterns"
process_files 'new URL\([^,]*["\047]/platform' '"/platform' '"/app' "URL constructor calls"
process_files "new URL\([^,]*['\"]\/platform" "'/platform" "'/app" "URL constructor calls (single quotes)"

# 12. Replace comments mentioning platform paths
print_status "📝 Step 12: Replacing comments with platform references"
process_files '// .*\/platform' '/platform' '/app' "comments with /platform"
process_files '/\* .*\/platform' '/platform' '/app' "multi-line comments with /platform"

# 13. Handle any Link component href props
print_status "📝 Step 13: Replacing Link component hrefs"
process_files '<Link[^>]*href=["\047]/platform' 'href="/platform' 'href="/app' "Link component href props"
process_files "<Link[^>]*href=['\"]\/platform" "href='/platform" "href='/app" "Link component href props (single quotes)"

print_success "✅ Replacement complete!"
print_success "📊 Summary:"
print_success "   - Files processed: $total_files"
print_success "   - Total replacements: $total_replacements"

# Verify the changes
print_status "🔍 Verification: Checking for any remaining /platform references..."
remaining_count=$(find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./dist/*" \
    -not -path "./build/*" \
    -not -path "./.next/*" \
    -exec grep -l "/platform" {} \; 2>/dev/null | wc -l)

if [[ $remaining_count -gt 0 ]]; then
    print_warning "⚠️  Found $remaining_count files that may still contain /platform references"
    print_warning "Run the following command to investigate:"
    print_warning "find . -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.js' -o -name '*.jsx' \) -not -path './node_modules/*' -exec grep -l '/platform' {} \;"
else
    print_success "🎉 No remaining /platform references found in source files!"
fi

# Optional: Show git diff summary
if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
    print_status "📋 Git diff summary:"
    git diff --stat
    print_status "💡 To see detailed changes, run: git diff"
    print_status "💡 To commit changes, run: git add . && git commit -m 'Replace /platform with /app throughout codebase'"
fi

print_success "🎯 Script completed successfully!"