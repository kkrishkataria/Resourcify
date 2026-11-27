# Resourcify – AWS Manual Console Deployment & Operations Guide
### Primary Region: Asia Pacific Sydney (`ap-southeast-2`) / Mumbai (`ap-south-1`) | 100% AWS Free Tier Suitable

This guide provides complete, step-by-step instructions to configure, deploy, operate, and maintain **Resourcify** manually through the **AWS Management Console** without Terraform, CloudFormation, or any Infrastructure-as-Code tooling.

---

## 🏛️ Architecture & Free Tier Compatibility

Resourcify uses a modern, 100% serverless, event-driven cloud architecture. Every service fits inside the **AWS Free Tier**:

| Service | Role | AWS Free Tier Allowance | Manual Console Configuration |
| :--- | :--- | :--- | :--- |
| **Amazon DynamoDB** | Database & 30-min Atomic Slot Locks | 25 GB storage & 25 WCU / 25 RCU free forever | 4 On-Demand tables with TTL on `expiresAt` |
| **AWS Lambda** | Express REST API & Auto-Release Worker | 1 Million free requests/mo & 3.2M sec compute | Node.js 20.x runtime (`resourcify-backend.zip`) |
| **Amazon API Gateway** | HTTP API routing & CORS preflight | 1 Million free API calls/mo for 12 months | Low-latency HTTP API with proxy integration |
| **Amazon S3** | React frontend hosting | 5 GB standard storage free for 12 months | Static Website Hosting or private OAC |
| **Amazon EventBridge** | 5-minute auto-release scheduler | Free default bus events | Rate rule `rate(5 minutes)` targeting Lambda |
| **Amazon CloudWatch** | Serverless telemetry & logs | 5 GB ingestion & 10 metric alarms free | Automatic Lambda Log Groups |

> **Cost Safety Note:** There are **zero** continuously running EC2 servers, NAT Gateways, or managed RDS databases. Costs remain **$0.00** when following this guide under normal usage.

---

## 📋 Pre-Deployment: Build Application Bundles Locally

Before opening the AWS Console, package the backend Lambda archive and compile the frontend React production build:

```bash
# 1. Package backend for AWS Lambda (generates resourcify-backend.zip at root, ~5.3 MB)
npm run package:backend

# 2. Compile frontend static assets (generates frontend/dist/)
npm run build:frontend
```

---

## Step 1: Create Amazon DynamoDB Tables

Sign in to the [AWS Management Console](https://console.aws.amazon.com/) and ensure the region dropdown in the top-right navbar is set to your active region (e.g. **Asia Pacific (Sydney) `ap-southeast-2`**).

Navigate to **DynamoDB** $\rightarrow$ **Tables** $\rightarrow$ **Create table**. Create the following 4 tables:

### 1.1 `CampusSlot-Resources` (Campus Facilities Catalog)
* **Table name:** `CampusSlot-Resources`
* **Partition key:** `id` (String)
* **Table settings:** Select **Customize settings**
  * **Table class:** DynamoDB Standard
  * **Capacity mode:** Select **On-demand** (Pay-per-request, zero idle cost)
* Click **Create table**.

### 1.2 `CampusSlot-Bookings` (Reservations & Check-In State)
* **Table name:** `CampusSlot-Bookings`
* **Partition key:** `id` (String)
* **Table settings:** Select **Customize settings** $\rightarrow$ **On-demand**
* Click **Create table**.
* *(Optional GSI)* Once created, click on `CampusSlot-Bookings` $\rightarrow$ **Indexes** $\rightarrow$ **Create index**:
  * **Partition key:** `resourceId` (String), **Sort key:** `date` (String)
  * **Index name:** `resourceId-date-index`, **Attribute projections:** All
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
  * Click **Turn on TTL**. *(DynamoDB will auto-purge old slot locks without consuming write capacity).*

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
3. **Add permissions:** Search and attach:
   * `AWSLambdaBasicExecutionRole` (allows CloudWatch logging)
   * `AmazonDynamoDBFullAccess` (allows read/write to the 4 DynamoDB tables)
4. Click **Next**.
5. **Role name:** Enter `CampusSlotLambdaRole`.
6. Click **Create role**.

*(Note: If you let Lambda auto-create the role on creation, simply open the created role in IAM, click **Add permissions** $\rightarrow$ **Attach policies**, and attach `AmazonDynamoDBFullAccess`).*

---

## Step 3: Create & Configure AWS Lambda Functions

Navigate to **AWS Lambda** $\rightarrow$ **Functions**.

### 3.1 Main API Lambda (`CampusSlotApiFunction`)
1. Click **Create function** $\rightarrow$ Select **Author from scratch**.
2. **Function name:** `CampusSlotApiFunction`
3. **Runtime:** Select **Node.js 20.x** (or **Node.js 22.x**).
4. **Architecture:** `x86_64`
5. **Permissions:** Use existing role `CampusSlotLambdaRole` (or auto-create and attach `AmazonDynamoDBFullAccess`).
6. Click **Create function**.

#### Upload Code Bundle:
1. In the **Code** tab, click **`Update ▾`** (or **Upload from**) $\rightarrow$ select **Upload a .zip file**.
2. Select the `resourcify-backend.zip` file created via `npm run package:backend`.
3. Click **Save** and wait for the upload to complete.

#### Configure Runtime Handler:
1. Scroll down to **Runtime settings** $\rightarrow$ Click **Edit**.
2. **Handler:** Change `index.handler` (or `index.mjs`) to:
   ```text
   src/lambda.handler
   ```
3. Click **Save**.

#### Configure Environment Variables:
1. Go to the **Configuration** tab $\rightarrow$ **Environment variables** $\rightarrow$ Click **Edit**.
2. Add the following key-value pairs *(Note: Do NOT add `AWS_REGION` here because AWS Lambda automatically sets it)*:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `DB_MODE` | `dynamodb` | Directs backend to read/write real DynamoDB tables |
| `DYNAMODB_TABLE_RESOURCES` | `CampusSlot-Resources` | Venue table name |
| `DYNAMODB_TABLE_BOOKINGS` | `CampusSlot-Bookings` | Bookings table name |
| `DYNAMODB_TABLE_SLOT_LOCKS` | `CampusSlot-SlotLocks` | Slot locks table name |
| `DYNAMODB_TABLE_USERS` | `CampusSlot-Users` | Users table name |
| `JWT_SECRET` | `resourcify-production-secret-key-2026` | Secure session signing secret |

3. Click **Save**.

#### Adjust Timeout:
* Under **Configuration** $\rightarrow$ **General configuration** $\rightarrow$ Click **Edit**:
  * **Memory:** `512 MB`
  * **Timeout:** `0 min 30 sec` *(prevents cold-start timeout)*
  * Click **Save**.

---

### 3.2 Scheduled Auto-Release Lambda (`CampusSlotAutoReleaseFunction`)
1. Click **Create function** $\rightarrow$ **Author from scratch**.
2. **Function name:** `CampusSlotAutoReleaseFunction`
3. **Runtime:** **Node.js 20.x**
4. **Role:** Select `CampusSlotLambdaRole`.
5. Upload the same `resourcify-backend.zip` file.
6. Under **Runtime settings**, change **Handler** to:
   ```text
   src/lambda.scheduledAutoReleaseHandler
   ```
7. Configure identical environment variables as `CampusSlotApiFunction`.
8. Set **Timeout** to `0 min 30 sec`.

---

## Step 4: Create Amazon API Gateway (HTTP API)

Navigate to **API Gateway** $\rightarrow$ Click **Create API**:
1. Locate **HTTP API** $\rightarrow$ Click **Build**.
2. Click **Add integration**:
   * Choose **Lambda**.
   * Function: Select `CampusSlotApiFunction`.
3. **API name:** Enter `resourcify-api`.
4. Click **Next**.

### Configure Routes:
1. In the route list:
   * **Method:** `ANY`
   * **Resource path:** `/{proxy+}`
   * **Integration target:** `CampusSlotApiFunction`
2. *(Optional root route)* Click **Add route**:
   * **Method:** `ANY`
   * **Resource path:** `/`
   * **Integration target:** `CampusSlotApiFunction`
3. Click **Next**.
4. **Stage:** Leave as `$default` with Auto-deploy **Enabled**.
5. Click **Next** $\rightarrow$ Click **Create**.

### Configure CORS (Critical for Web Browsers):
1. In the left navigation menu under **Develop**, click **CORS**.
2. Click **Configure**:
   * **Access-Control-Allow-Origin:** Type `*` and press Enter.
   * **Access-Control-Allow-Headers:** Type `*` and press Enter.
   * **Access-Control-Allow-Methods:** Select `GET, POST, PUT, DELETE, OPTIONS, PATCH`.
3. Click **Save**.

> **Note your API URL:** Under **Stages** $\rightarrow$ `$default`, copy the **Invoke URL** (e.g. `https://9xaei7owm1.execute-api.ap-southeast-2.amazonaws.com`). Your API root is `https://<api-id>.execute-api.<region>.amazonaws.com/api`.

---

## Step 5: Seed Campus Facilities & Users to DynamoDB

With the backend deployed, populate all 9 Thapar University facilities (NVIDIA Supercomputing Lab, Central Library pods, sports courts) and demo accounts (`student@thapar.edu`, `admin@thapar.edu`) into DynamoDB:

Simply open this URL in your web browser:
```text
https://<api-id>.execute-api.<region>.amazonaws.com/api/seed
```
*Expected response:*
```json
{
  "success": true,
  "message": "Thapar campus facilities and default accounts seeded successfully into DynamoDB."
}
```

Verify that 9 facilities appear by visiting:
```text
https://<api-id>.execute-api.<region>.amazonaws.com/api/resources
```

---

## Step 6: Host Frontend on Amazon S3

### 6.1 Update Local Frontend Config & Build
In your local project, edit `frontend/.env` to point to your live API Gateway URL:
```env
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/api
VITE_ENABLE_MOCK_AUTH=false
```

Compile the optimized static bundle:
```bash
npm run build:frontend
```
This generates your production-ready files in `frontend/dist/`.

---

### 6.2 Method A: S3 Static Website Hosting (Instant & Free Tier, Recommended)
This method requires **zero account verification**, takes **1 minute**, and is **100% Free Tier**.

1. Navigate to **Amazon S3** $\rightarrow$ Click **Create bucket**.
2. **Bucket name:** Choose a globally unique name, e.g. `resourcify-web-<yourname>`.
3. **Region:** Same region (e.g. `ap-southeast-2`).
4. **Block Public Access:** **Uncheck** *Block all public access*, and check the acknowledgement box.
5. Click **Create bucket**.

#### Enable Static Website Hosting:
1. Open your bucket $\rightarrow$ Click the **Properties** tab.
2. Scroll to the bottom to **Static website hosting** $\rightarrow$ Click **Edit**:
   * Select **Enable**.
   * Hosting type: **Host a static website**.
   * **Index document:** `index.html`
   * **Error document:** `index.html` *(required for React Single Page App client-side routing)*.
   * Click **Save changes**.
3. Copy the **Bucket website endpoint** URL at the bottom of the page.

#### Set Public Read Bucket Policy:
1. Click the **Permissions** tab $\rightarrow$ Under **Bucket policy**, click **Edit**.
2. Paste the following JSON (replace `resourcify-web-<yourname>` with your actual bucket name):
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "PublicReadGetObject",
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::resourcify-web-<yourname>/*"
           }
       ]
   }
   ```
3. Click **Save changes**.

#### Upload Build Files:
1. Click the **Objects** tab $\rightarrow$ Click **Upload**.
2. Upload all contents from `frontend/dist/`:
   * `index.html`
   * `favicon.svg`
   * `assets/` folder
3. Click **Upload**.

Open your **Bucket website endpoint** URL in your browser — your full-stack campus booking application is live!

---

### 6.3 Method B: Amazon CloudFront CDN (HTTPS Distribution)
For production deployments requiring custom domains and global edge caching:

1. Navigate to **CloudFront** $\rightarrow$ Click **Create distribution**.
2. **Origin domain:** Select your S3 bucket.
3. **Origin access:** Select **Origin access control settings (recommended)** $\rightarrow$ Create OAC.
4. **Viewer protocol policy:** Select **Redirect HTTP to HTTPS**.
5. **Default root object:** Enter `index.html`.
6. Click **Create distribution**.
7. **Custom Error Pages (for SPA Routing):**
   * Go to **Error pages** tab $\rightarrow$ **Create custom error response**:
     * HTTP error: `403: Forbidden` $\rightarrow$ Customize: Yes $\rightarrow$ Path: `/index.html` $\rightarrow$ Code: `200: OK`.
     * HTTP error: `404: Not Found` $\rightarrow$ Customize: Yes $\rightarrow$ Path: `/index.html` $\rightarrow$ Code: `200: OK`.
8. Copy the generated S3 bucket policy from CloudFront and paste it into your S3 bucket permissions.

---

## Step 7: Configure Amazon EventBridge (5-Minute No-Show Auto-Release)

To automatically release bookings where the student fails to check in within 15 minutes:

1. Navigate to **Amazon EventBridge** $\rightarrow$ **Schedules** (or **Rules**) $\rightarrow$ Click **Create rule**.
2. **Name:** `CampusSlot-5MinAutoRelease`
3. **Rule type:** Select **Schedule**.
4. **Schedule pattern:**
   * Recurring rate: `5` minutes (`rate(5 minutes)`).
5. **Target:**
   * Target: **AWS service** $\rightarrow$ **Lambda function**.
   * Function: Select `CampusSlotAutoReleaseFunction`.
6. Click **Next** $\rightarrow$ Click **Create rule**.

*(Note: Administrators can also trigger the auto-release job manually anytime from the **Campus Analytics** dashboard by clicking **Run Auto-Release Job**).*

---

## Step 8: Configure Amazon CloudWatch Logs & Monitoring

1. Navigate to **CloudWatch** $\rightarrow$ **Log groups**:
   * `/aws/lambda/CampusSlotApiFunction`
   * `/aws/lambda/CampusSlotAutoReleaseFunction`
2. **Log Retention (Cost Prevention):**
   * Select both log groups $\rightarrow$ Click **Actions** $\rightarrow$ **Edit retention setting**.
   * Change from *Never expire* to **7 days** or **14 days** to stay well within the Free Tier 5 GB log allowance.
3. **Metrics:**
   * In Lambda, click the **Monitor** tab to observe Invocations, Duration, and Error rates in real time.

---

## 🧪 End-to-End Verification Checklist

| Test Item | Verification Procedure | Expected Outcome |
| :--- | :--- | :--- |
| **API Health Check** | `curl https://<api-id>.execute-api.<region>.amazonaws.com/health` | `HTTP 200` with `{"status":"UP","service":"CampusSlot API"}` |
| **Facilities Catalog** | Visit `/api/resources` | Returns array of 9 Thapar facilities with capacities & equipment |
| **Student Sign-In** | Use auto-fill card **Student (B.Tech)** (`asharma_be22@thapar.edu` / `Thapar@2026`) | Issues signed JWT token, opens Student Dashboard |
| **Conflict Prevention** | Attempt 2 bookings for the same facility & time slot | First succeeds; second is rejected with `SLOT_CONFLICT` |
| **Past Slot Rejection** | Attempt to book a time slot in the past | Rejected with `PAST_TIME_SLOT` error |
| **Auto-Allocation** | Submit auto-allocation request with capacity requirements | Recommends optimal venue with minimum wasted seats |
| **Admin Analytics** | Sign in as **Chief Estate Officer** (`admin@thapar.edu`) $\rightarrow$ `/admin/analytics` | Displays live telemetry, peak hours, category utilization |
| **Auto-Release** | Click **Run Auto-Release Job** on Analytics page | Scans and releases expired unattended check-in reservations |

---

## 🗑️ Teardown Guide (Delete All Cloud Resources)

To stop all AWS cloud usage and cleanly remove all resources:
1. **S3:** Open your bucket (`resourcify-web-...`) $\rightarrow$ Click **Empty** $\rightarrow$ Click **Delete**.
2. **CloudFront (if used):** Disable the distribution, wait until disabled, then click **Delete**.
3. **API Gateway:** Select `resourcify-api` $\rightarrow$ Click **Delete**.
4. **Lambda:** Select and delete `CampusSlotApiFunction` and `CampusSlotAutoReleaseFunction`.
5. **DynamoDB:** Delete the 4 tables (`CampusSlot-Resources`, `CampusSlot-Bookings`, `CampusSlot-SlotLocks`, `CampusSlot-Users`).
6. **EventBridge:** Delete the `CampusSlot-5MinAutoRelease` rule.
7. **CloudWatch:** Delete `/aws/lambda/CampusSlotApiFunction` and `/aws/lambda/CampusSlotAutoReleaseFunction` log groups.
8. **IAM:** Delete the role `CampusSlotLambdaRole`.
