# Resourcify – AWS Manual Console Deployment & Operations Guide
### Region: AWS Mumbai (`ap-south-1`) | 100% AWS Free Tier Suitable

This guide provides complete, step-by-step instructions to configure, deploy, operate, and maintain **Resourcify** manually through the **AWS Management Console** without Terraform, CloudFormation, or any Infrastructure-as-Code tooling.

---

## 🏛️ Architecture & Free Tier Compatibility

Every service utilized in Resourcify fits inside the **AWS Free Tier**:

| Service | Role | AWS Free Tier Allowance | Manual Console Configuration |
| :--- | :--- | :--- | :--- |
| **Amazon DynamoDB** | Database & 30-min Atomic Slot Locks | 25 GB storage & 25 WCU / 25 RCU free forever | 4 On-Demand tables with TTL |
| **AWS Lambda** | Express REST API & Auto-Release Cron | 1 Million free requests/mo & 3.2M sec compute | Node.js 20.x runtime (`resourcify-backend.zip`) |
| **Amazon API Gateway** | HTTP API routing | 1 Million free API calls/mo for 12 months | Low-latency HTTP API with CORS |
| **Amazon Cognito** | User Pool & JWT authentication | 50,000 Monthly Active Users (MAUs) free | User Pool + SPA App Client |
| **Amazon S3** | React frontend hosting | 5 GB standard storage free for 12 months | Private bucket with OAC |
| **Amazon CloudFront** | CDN distribution & HTTPS | 1 TB data transfer out & 10M requests/mo | Custom error page for React SPA |
| **Amazon EventBridge** | 5-minute auto-release scheduler | Free default bus events | Rate rule `rate(5 minutes)` targeting Lambda |
| **Amazon SNS** | Real-time booking notifications | 1 Million mobile/email publishes free/mo | Standard FIFO-free Topic |
| **Amazon CloudWatch** | Serverless telemetry & logs | 5 GB ingestion & 10 metric alarms free | Automatic Lambda Log Groups |

> **Cost Safety Note:** There are **zero** continuously running EC2 servers, NAT Gateways, or managed RDS databases. Costs remain **\$0.00** when following this guide under normal usage.

---

## 📋 Pre-Deployment: Build Application Bundles

Before opening the AWS Console, package the backend Lambda archive and compile the frontend React production build locally:

```bash
# 1. Package backend for AWS Lambda (generates resourcify-backend.zip at root)
npm run package:backend

# 2. Compile frontend static assets (generates frontend/dist/)
npm run build:frontend
```

---

## Step 1: Create Amazon DynamoDB Tables

Sign in to the [AWS Management Console](https://console.aws.amazon.com/) and ensure the region dropdown in the top-right navbar is set to **Asia Pacific (Mumbai) `ap-south-1`**.

Navigate to **DynamoDB** $\rightarrow$ **Tables** $\rightarrow$ **Create table**. Create the following 4 tables:

### 1.1 `CampusSlot-Resources` (Campus Facilities Catalog)
* **Table name:** `CampusSlot-Resources`
* **Partition key:** `id` (String)
* **Table settings:** Select **Customize settings**
  * **Table class:** DynamoDB Standard
  * **Capacity calculator / Read/write capacity:** Select **On-demand** (Pay-per-request, zero idle cost)
* Click **Create table**.

### 1.2 `CampusSlot-Bookings` (Reservations & Check-In State)
* **Table name:** `CampusSlot-Bookings`
* **Partition key:** `id` (String)
* **Table settings:** Select **Customize settings** $\rightarrow$ **On-demand**
* Click **Create table**.
* Once created, click on `CampusSlot-Bookings` $\rightarrow$ **Indexes** $\rightarrow$ **Create index**:
  * **Partition key:** `resourceId` (String)
  * **Sort key:** `date` (String)
  * **Index name:** `resourceId-date-index`
  * **Attribute projections:** All
  * Click **Create index**.

### 1.3 `CampusSlot-SlotLocks` (30-Min Atomic Concurrency Locks & TTL)
* **Table name:** `CampusSlot-SlotLocks`
* **Partition key:** `lockKey` (String) *(e.g. `res-tiet-lab-01#2026-11-25#10:00`)*
* **Table settings:** Select **Customize settings** $\rightarrow$ **On-demand**
* Click **Create table**.
* **Enable TTL (Automatic 24-Hour Expiration):**
  * Open `CampusSlot-SlotLocks` $\rightarrow$ **Additional settings** tab.
  * Under **Time to Live (TTL)**, click **Turn on**.
  * **TTL attribute name:** Enter `expiresAt`.
  * Click **Turn on TTL**. *(DynamoDB will now auto-purge old slot locks without consuming write capacity).*

### 1.4 `CampusSlot-Users` (Registered Accounts & Role Data)
* **Table name:** `CampusSlot-Users`
* **Partition key:** `id` (String)
* **Table settings:** Select **Customize settings** $\rightarrow$ **On-demand**
* Click **Create table**.

---

## Step 2: Create IAM Role for Lambda Functions

Navigate to **IAM** $\rightarrow$ **Roles** $\rightarrow$ **Create role**:
1. **Trusted entity type:** Select **AWS service**.
2. **Use case:** Select **Lambda** $\rightarrow$ Click **Next**.
3. **Add permissions:** Search and attach the following managed policies:
   * `AWSLambdaBasicExecutionRole` (allows CloudWatch logging)
4. Click **Next**.
5. **Role name:** Enter `ResourcifyLambdaExecutionRole`.
6. Click **Create role**.

### Add Inline Policy for DynamoDB & SNS Access:
1. Click on `ResourcifyLambdaExecutionRole` $\rightarrow$ **Add permissions** $\rightarrow$ **Create inline policy**.
2. Switch to the **JSON** editor and paste:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "DynamoDBTableAccess",
         "Effect": "Allow",
         "Action": [
           "dynamodb:GetItem",
           "dynamodb:PutItem",
           "dynamodb:UpdateItem",
           "dynamodb:DeleteItem",
           "dynamodb:Scan",
           "dynamodb:Query",
           "dynamodb:BatchWriteItem",
           "dynamodb:BatchGetItem",
           "dynamodb:TransactWriteItems"
         ],
         "Resource": [
           "arn:aws:dynamodb:ap-south-1:*:table/CampusSlot-*",
           "arn:aws:dynamodb:ap-south-1:*:table/CampusSlot-*/index/*"
         ]
       },
       {
         "Sid": "SNSPublishAccess",
         "Effect": "Allow",
         "Action": [
           "sns:Publish"
         ],
         "Resource": "arn:aws:sns:ap-south-1:*:CampusSlot-Notifications"
       }
     ]
   }
   ```
3. Click **Next**, name the policy `ResourcifyDynamoDBSNSPolicy`, and click **Create policy**.

---

## Step 3: Create & Configure AWS Lambda Functions

Navigate to **AWS Lambda** $\rightarrow$ **Functions** in `ap-south-1`.

### 3.1 Main API Lambda (`CampusSlotApiFunction`)
1. Click **Create function** $\rightarrow$ Select **Author from scratch**.
2. **Function name:** `CampusSlotApiFunction`
3. **Runtime:** **Node.js 20.x**
4. **Architecture:** `x86_64`
5. **Permissions:** Expand *Change default execution role* $\rightarrow$ Select **Use an existing role** $\rightarrow$ Pick `ResourcifyLambdaExecutionRole`.
6. Click **Create function**.

#### Upload Code Bundle:
1. In the **Code source** section, click **Upload from** $\rightarrow$ **.zip file**.
2. Select the `resourcify-backend.zip` file created via `npm run package:backend`.
3. Click **Save** and wait for upload to complete.

#### Configure Runtime & Handler:
1. Scroll down to **Runtime settings** $\rightarrow$ Click **Edit**.
2. **Handler:** Change `index.handler` to:
   ```text
   src/lambda.handler
   ```
3. Click **Save**.

#### Configure Environment Variables:
1. Go to the **Configuration** tab $\rightarrow$ **Environment variables** $\rightarrow$ Click **Edit**.
2. Add the following key-value pairs:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `DB_MODE` | `dynamodb` |
   | `AWS_REGION` | `ap-south-1` |
   | `DYNAMODB_TABLE_RESOURCES` | `CampusSlot-Resources` |
   | `DYNAMODB_TABLE_BOOKINGS` | `CampusSlot-Bookings` |
   | `DYNAMODB_TABLE_SLOT_LOCKS` | `CampusSlot-SlotLocks` |
   | `DYNAMODB_TABLE_USERS` | `CampusSlot-Users` |
   | `SLOT_DURATION_MINUTES` | `30` |
   | `CHECKIN_GRACE_PERIOD_MINUTES`| `15` |
3. Click **Save**.

#### General Configuration:
* Under **Configuration** $\rightarrow$ **General configuration** $\rightarrow$ Click **Edit**:
  * **Memory:** `512 MB`
  * **Timeout:** `15 sec`
  * Click **Save**.

---

### 3.2 Scheduled Auto-Release Lambda (`CampusSlotAutoReleaseFunction`)
1. Click **Create function** $\rightarrow$ **Author from scratch**.
2. **Function name:** `CampusSlotAutoReleaseFunction`
3. **Runtime:** **Node.js 20.x**
4. **Role:** Use `ResourcifyLambdaExecutionRole`.
5. Click **Create function**.
6. Upload the same `resourcify-backend.zip` file.
7. Under **Runtime settings**, change **Handler** to:
   ```text
   src/lambda.scheduledAutoReleaseHandler
   ```
8. In **Environment variables**, configure identical variables as `CampusSlotApiFunction`.
9. Set **Timeout** to `30 sec`.

---

## Step 4: Create Amazon API Gateway (HTTP API)

Navigate to **API Gateway** $\rightarrow$ Click **Create API**:
1. Locate **HTTP API** $\rightarrow$ Click **Build**.
2. **API name:** `CampusSlotApi`
3. Click **Next**.

### Configure Routes:
1. Under **Configure routes**, click **Add route**:
   * **Method:** `ANY`
   * **Resource path:** `/{proxy+}`
   * **Integration:** Select **Lambda** $\rightarrow$ Choose `CampusSlotApiFunction`.
2. Click **Add route**:
   * **Method:** `GET`
   * **Resource path:** `/health`
   * **Integration:** Select **Lambda** $\rightarrow$ Choose `CampusSlotApiFunction`.
3. Click **Next**.
4. **Stage:** Leave stage name as `$default` with Auto-deploy **Enabled**.
5. Click **Next** $\rightarrow$ Click **Create**.

### Configure CORS:
1. In the left navigation, select **CORS**.
2. Click **Configure**:
   * **Access-Control-Allow-Origins:** `*`
   * **Access-Control-Allow-Methods:** `GET, POST, PUT, DELETE, OPTIONS`
   * **Access-Control-Allow-Headers:** `Content-Type, Authorization, x-user-id, x-user-role, x-user-email, x-user-name`
   * **Access-Control-Max-Age:** `300`
3. Click **Save**.

> **Note your API Endpoint:** Copy the **Invoke URL** displayed on the API dashboard (e.g. `https://<api-id>.execute-api.ap-south-1.amazonaws.com`). Your API root is: `https://<api-id>.execute-api.ap-south-1.amazonaws.com/api`.

---

## Step 5: Configure Amazon Cognito User Pool

Navigate to **Cognito** $\rightarrow$ Click **Create user pool**:
1. **Authentication providers:**
   * Select **User name** and check **Also allow sign in with verified email address**.
2. **Password policy:** Cognito defaults (Minimum 8 chars, numbers, uppercase, lowercase, special).
3. **Multi-factor authentication (MFA):** Select **No MFA** (for Free Tier student usage).
4. **User account recovery:** Email only.
5. **Self-service registration:** Keep **Enabled**.
6. **Required attributes:** Select `name` and `email`.
7. **Email provider:** Select **Send email with Cognito** (50 emails/day free tier).
8. **User pool name:** `CampusSlot-UsersPool`
9. **App client:**
   * Select **Public client (Single-page app SPA)**.
   * **App client name:** `CampusSlotWebClient`
   * **Client secret:** Select **Don't generate a client secret** (required for browser JavaScript SPAs).
10. Click **Create user pool**.

> Note your **User Pool ID** (`ap-south-1_xxxxxxxxx`) and **App Client ID**.

---

## Step 6: Configure Amazon SNS Notifications

Navigate to **Amazon SNS** $\rightarrow$ **Topics** $\rightarrow$ Click **Create topic**:
1. **Type:** Select **Standard**.
2. **Name:** `CampusSlot-Notifications`
3. Click **Create topic**.
4. Copy the **Topic ARN** (e.g. `arn:aws:sns:ap-south-1:<account-id>:CampusSlot-Notifications`).

### Subscribe for Email Alerts:
1. In topic details, click **Create subscription**:
   * **Protocol:** Select **Email**.
   * **Endpoint:** Enter your email address.
   * Click **Create subscription**.
2. Check your inbox and click **Confirm subscription**.
3. Update the `SNS_BOOKING_NOTIFICATIONS_TOPIC_ARN` environment variable in both Lambda functions with this ARN.

---

## Step 7: Configure Amazon EventBridge (Scheduled No-Show Release)

Navigate to **Amazon EventBridge** $\rightarrow$ **Schedules** (or **Rules**) $\rightarrow$ Click **Create rule**:
1. **Name:** `CampusSlot-5MinAutoRelease`
2. **Rule type:** Select **Schedule**.
3. **Schedule pattern:**
   * Select **A recurring schedule that runs at a regular rate**.
   * **Rate expression:** `5` minutes (`rate(5 minutes)`).
4. Click **Next**.
5. **Target:**
   * **Target API:** Select **AWS service** $\rightarrow$ **Lambda function**.
   * **Function:** Select `CampusSlotAutoReleaseFunction`.
6. Click **Next** $\rightarrow$ Click **Create rule**.

*Every 5 minutes, EventBridge will now trigger the worker to reclaim unclaimed slot locks automatically.*

---

## Step 8: Configure Amazon CloudWatch Logs & Metrics

Lambda automatically creates CloudWatch Log Groups:
1. Navigate to **CloudWatch** $\rightarrow$ **Log groups**:
   * `/aws/lambda/CampusSlotApiFunction`
   * `/aws/lambda/CampusSlotAutoReleaseFunction`
2. **Log Retention (Cost Prevention):**
   * Select the log groups $\rightarrow$ Click **Actions** $\rightarrow$ **Edit retention setting**.
   * Change from *Never expire* to **7 days** or **14 days** to remain safely within the Free Tier 5 GB log allowance.
3. **Monitor Metrics:**
   * Go to **Metrics** $\rightarrow$ **Lambda**: monitor `Invocations`, `Duration`, `Errors`, and `Throttles`.

---

## Step 9: Host Frontend on Amazon S3 & Amazon CloudFront

### 9.1 Create S3 Bucket for Static Assets
1. Navigate to **Amazon S3** $\rightarrow$ **Create bucket**.
2. **Bucket name:** `resourcify-frontend-<your-aws-account-id>-ap-south-1`
3. **AWS Region:** `ap-south-1`
4. **Block Public Access settings:** Keep **Block all public access enabled** (CloudFront will access S3 privately via Origin Access Control).
5. **Bucket Versioning:** Disabled.
6. Click **Create bucket**.

### 9.2 Create CloudFront Distribution
1. Navigate to **CloudFront** $\rightarrow$ **Create distribution**.
2. **Origin domain:** Select your S3 bucket (`resourcify-frontend-...s3.ap-south-1.amazonaws.com`).
3. **Origin access:** Select **Origin access control settings (recommended)** $\rightarrow$ Click **Create control setting** $\rightarrow$ Click **Create**.
4. **Viewer protocol policy:** Select **Redirect HTTP to HTTPS**.
5. **Allowed HTTP methods:** `GET, HEAD, OPTIONS`.
6. **Price class:** Select **Use only North America and Europe** or **Use all edge locations** (1 TB/month free).
7. **Default root object:** Enter `index.html`.
8. Click **Create distribution**.

### 9.3 Configure SPA Client-Side Routing (Error Pages)
React Router uses HTML5 pushState. To prevent `403 Forbidden` / `404 Not Found` when refreshing sub-pages (e.g. `/my-bookings`):
1. In CloudFront distribution details, go to the **Error pages** tab.
2. Click **Create custom error response**:
   * **HTTP error code:** `403: Forbidden`
   * **Customize error response:** Yes
   * **Response page path:** `/index.html`
   * **HTTP response code:** `200: OK`
   * Click **Create**.
3. Create a second error response for `404: Not Found` pointing to `/index.html` with response code `200: OK`.

### 9.4 Update S3 Bucket Policy
1. When CloudFront is created, a prompt displays **"The S3 bucket policy needs to be updated"**. Click **Copy policy**.
2. Go back to S3 $\rightarrow$ Your bucket $\rightarrow$ **Permissions** tab $\rightarrow$ **Bucket policy** $\rightarrow$ Click **Edit**.
3. Paste the CloudFront policy granting `s3:GetObject` to the CloudFront distribution ARN and click **Save changes**.

### 9.5 Deploy Frontend Build to S3
In your local project, configure `frontend/.env`:
```env
VITE_API_BASE_URL=https://<api-id>.execute-api.ap-south-1.amazonaws.com/api
```
Recompile and sync to S3:
```bash
npm run build:frontend
aws s3 sync frontend/dist s3://resourcify-frontend-<your-aws-account-id>-ap-south-1 --delete
```

---

## Step 10: Seed Cloud Database & Test Deployed System

### 10.1 Seed Campus Facilities and Users to DynamoDB
Set your local environment to target live DynamoDB tables:
```bash
# Set temporary session credentials or export in terminal
export DB_MODE=dynamodb
export AWS_REGION=ap-south-1

# Run Thapar campus facility and accounts seed
npm run seed
```
This inserts the NVIDIA Deep Learning Lab, Nava Nalanda Pods, LP Lecture Halls, Sports Courts, and demo Student/Professor/Admin accounts directly into your DynamoDB tables.

### 10.2 End-to-End Verification Checklist
1. **API Health Check:**
   ```bash
   curl https://<api-id>.execute-api.ap-south-1.amazonaws.com/health
   ```
   *Expected response:* `{"status":"UP","service":"CampusSlot API",...}`
2. **Access CloudFront Frontend:**
   * Open `https://<distribution-id>.cloudfront.net` in your browser.
   * Verify the favicon, Thapar Maroon branding, and venues display cleanly.
3. **Test Student Booking:**
   * Sign in using Student Roll No `102203456` / `Thapar@2026`.
   * Reserve an upcoming 30-min slot.
   * Verify the slot turns **OCCUPIED** in the UI.
   * Open AWS Console $\rightarrow$ DynamoDB $\rightarrow$ `CampusSlot-SlotLocks` to observe the atomic lock item (`res-tiet-lab-01#YYYY-MM-DD#HH:MM`).
4. **Test Check-In & Auto-Release:**
   * Click **Check In** to confirm the session.
   * Test the Auto-Release job by clicking **Run Auto-Release Job** on the Admin Console (`/admin/analytics`).

---

## 🗑️ Teardown Guide (Delete All Cloud Resources)

If you wish to stop all AWS cloud usage completely:
1. **CloudFront:** Disable the distribution, wait ~3 minutes until disabled, then click **Delete**.
2. **S3:** Empty the `resourcify-frontend-...` bucket, then click **Delete**.
3. **API Gateway:** Select `CampusSlotApi` $\rightarrow$ **Actions** $\rightarrow$ **Delete**.
4. **Lambda:** Delete `CampusSlotApiFunction` and `CampusSlotAutoReleaseFunction`.
5. **DynamoDB:** Delete the 4 tables (`CampusSlot-Resources`, `CampusSlot-Bookings`, `CampusSlot-SlotLocks`, `CampusSlot-Users`).
6. **Cognito & SNS:** Delete `CampusSlot-UsersPool` and topic `CampusSlot-Notifications`.
7. **IAM:** Delete role `ResourcifyLambdaExecutionRole`.
