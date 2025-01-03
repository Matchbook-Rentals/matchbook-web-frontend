#!/bin/bash

# Hardcoded script to rename U.S. state image files.

# Function to perform the renaming for each file
rename_file() {
  local old_name="$1"
  local new_name="$2"

  if [[ -f "$old_name" ]]; then
    echo "Renaming '$old_name' to '$new_name'"
    mv "$old_name" "$new_name"
  else
    echo "File not found: '$old_name'"
  fi
}

# List of files to rename (old name, new name)
rename_file "Alabama.jpg" "Alabama.jpg"
rename_file "Alaska.jpg" "Alaska.jpg"
rename_file "Arizona.jpg" "Arizona.jpg"
rename_file "Arkansas.jpg" "Arkansas.jpg"
rename_file "California.jpg" "California.jpg"
rename_file "Colorado.jpg" "Colorado.jpg"
rename_file "Connecticut.jpg" "Connecticut.jpg"
rename_file "Delaware.jpg" "Delaware.jpg"
rename_file "Florida.jpg" "Florida.jpg"
rename_file "Georgia.jpg" "Georgia.jpg"
rename_file "Hawaii.jpg" "Hawaii.jpg"
rename_file "Idaho.jpg" "Idaho.jpg"
rename_file "Illinois.jpg" "Illinois.jpg"
rename_file "Indiana.jpg" "Indiana.jpg"
rename_file "Iowa.jpg" "Iowa.jpg"
rename_file "Kansas.jpg" "Kansas.jpg"
rename_file "Kentucky.jpg" "Kentucky.jpg"
rename_file "Louisiana.jpg" "Louisiana.jpg"
rename_file "Maine.jpg" "Maine.jpg"
rename_file "Maryland.jpg" "Maryland.jpg"
rename_file "Massachusetts.jpg" "Massachusetts.jpg"
rename_file "Michigan.jpg" "Michigan.jpg"
rename_file "Minnesota.jpg" "Minnesota.jpg"
rename_file "Mississippi.jpg" "Mississippi.jpg"
rename_file "Missouri.jpg" "Missouri.jpg"
rename_file "Montana.jpg" "Montana.jpg"
rename_file "Nebraska.jpg" "Nebraska.jpg"
rename_file "Nevada.jpg" "Nevada.jpg"
rename_file "'New Hampshire.jpg'" "New Hampshire.jpg"
rename_file "'New Jersey.jpg'" "New Jersey.jpg"
rename_file "'New Mexico.jpg'" "New Mexico.jpg"
rename_file "'New York.jpg'" "New York.jpg"
rename_file "'North Carolina.jpg'" "North Carolina.jpg"
rename_file "'North Dakota.jpg'" "North Dakota.jpg"
rename_file "Ohio.jpg" "Ohio.jpg"
rename_file "Oklahoma.jpg" "Oklahoma.jpg"
rename_file "Oregon.jpg" "Oregon.jpg"
rename_file "Pennsylvania.jpg" "Pennsylvania.jpg"
rename_file "'Rhode Island.jpg'" "Rhode Island.jpg"
rename_file "'South Carolina.jpg'" "South Carolina.jpg"
rename_file "'South Dakota.jpg'" "South Dakota.jpg"
rename_file "Tennessee.jpg" "Tennessee.jpg"
rename_file "Texas.jpg" "Texas.jpg"
rename_file "Utah.jpg" "Utah.jpg"
rename_file "Vermont.jpg" "Vermont.jpg"
rename_file "Virginia.jpg" "Virginia.jpg"
rename_file "'Washington.jpg'" "Washington.jpg"
rename_file "'Washington DC.jpg'" "Washington DC.jpg"
rename_file "'West Virginia.jpg'" "West Virginia.jpg"
rename_file "Wisconsin.jpg" "Wisconsin.jpg"
rename_file "Wyoming.jpg" "Wyoming.jpg"
