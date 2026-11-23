# 1. Resources Table
resource "aws_dynamodb_table" "resources" {
  name         = "CampusSlot-Resources"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  global_secondary_index {
    name            = "CategoryIndex"
    hash_key        = "category"
    projection_type = "ALL"
  }
}

# 2. Bookings Table
resource "aws_dynamodb_table" "bookings" {
  name         = "CampusSlot-Bookings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "resourceId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  global_secondary_index {
    name            = "UserBookingsIndex"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "ResourceDateIndex"
    hash_key        = "resourceId"
    range_key       = "date"
    projection_type = "ALL"
  }
}

# 3. SlotLocks Table
resource "aws_dynamodb_table" "slot_locks" {
  name         = "CampusSlot-SlotLocks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "lockKey"

  attribute {
    name = "lockKey"
    type = "S"
  }

  attribute {
    name = "resourceId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  global_secondary_index {
    name            = "ResourceDateSlotsIndex"
    hash_key        = "resourceId"
    range_key       = "date"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }
}

# 4. Users Table
resource "aws_dynamodb_table" "users" {
  name         = "CampusSlot-Users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }
}
