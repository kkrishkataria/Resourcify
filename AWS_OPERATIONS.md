# CampusSlot / ResourSync — AWS Deployment & Teardown Guide

This document contains step-by-step instructions to **deploy (start)** and **destroy (teardown)** the entire AWS infrastructure using Terraform.

---

## ⚡ Quick Cheatsheet

### 🚀 To Deploy (Start All AWS Services)
```powershell
# 1. Package backend for Lambda
cd c:\Users\krish\OneDrive\Desktop\Resourcify
.\build-lambda.ps1

# 2. Deploy Infrastructure
cd terraform
terraform apply -auto-approve

# 3. Seed DynamoDB Tables (Venues & Accounts)
cd ..\backend
npm run seed

# 4. Build & Upload Frontend to S3
cd ..\frontend
npm run build
aws s3 sync dist s3://campusslot-frontend-899887267535-ap-south-1 --delete
```

### 🗑️ To Destroy (Stop & Delete All AWS Services)
```powershell
cd c:\Users\krish\OneDrive\Desktop\Resourcify\terraform
terraform destroy -auto-approve
```

---

## 📋 Deployed Services Overview

| Component | AWS Service | Name / Identifier |
|---|---|---|
| **Frontend CDN** | Amazon CloudFront | `https://dn2zbsg8c9mvr.cloudfront.net` |
| **Frontend Storage** | Amazon S3 | `campusslot-frontend-899887267535-ap-south-1` |
| **Backend API** | Amazon API Gateway | `https://91rk54hc4h.execute-api.ap-south-1.amazonaws.com/prod/api` |
| **Backend Compute** | AWS Lambda | `CampusSlotApiFunction`, `CampusSlotAutoReleaseFunction` |
| **Database** | Amazon DynamoDB | `CampusSlot-Resources`, `CampusSlot-Bookings`, `CampusSlot-SlotLocks`, `CampusSlot-Users` |
| **Authentication** | Amazon Cognito | User Pool: `ap-south-1_RWNSalSKC` |
| **Notifications** | Amazon SNS | `arn:aws:sns:ap-south-1:899887267535:CampusSlot-Notifications` |

---

## 🚀 Detailed Start / Deploy Guide

### Step 1: Verify AWS Credentials
Ensure your AWS CLI is authenticated with the management account:
```powershell
aws sts get-caller-identity
```
Confirm the output shows Account `899887267535`.

### Step 2: Build the Lambda Bundle
From the project root:
```powershell
cd c:\Users\krish\OneDrive\Desktop\Resourcify
.\build-lambda.ps1
```
This isolates the backend from the npm workspace and bundles real production `node_modules` into `terraform/backend_bundle.zip`.

### Step 3: Apply Terraform
```powershell
cd c:\Users\krish\OneDrive\Desktop\Resourcify\terraform
terraform init
terraform apply -auto-approve
```
Terraform will provision all 32 resources across DynamoDB, Lambda, API Gateway, S3, CloudFront, Cognito, and SNS.

### Step 4: Seed the Database
Populate Thapar campus venues, auditoriums, sports courts, and demo student/faculty accounts into your DynamoDB tables:
```powershell
cd c:\Users\krish\OneDrive\Desktop\Resourcify\backend
npm run seed
```

### Step 5: Build and Upload the Frontend
Compile the React Single Page Application and upload it to the S3 bucket:
```powershell
cd c:\Users\krish\OneDrive\Desktop\Resourcify\frontend
npm run build
aws s3 sync dist s3://campusslot-frontend-899887267535-ap-south-1 --delete
```

### Step 6: Test Live Application
1. **API Health Check**:
   ```powershell
   curl.exe https://91rk54hc4h.execute-api.ap-south-1.amazonaws.com/prod/health
   ```
   Should return: `{"status":"UP","service":"CampusSlot API",...}`

2. **Frontend Website**:
   Open in your browser:
   👉 **[https://dn2zbsg8c9mvr.cloudfront.net](https://dn2zbsg8c9mvr.cloudfront.net)**

---

## 🗑️ Detailed Teardown / Destroy Guide

Run this whenever you are done testing to **stop all AWS charges**:

### Step 1: Destroy Infrastructure via Terraform
```powershell
cd c:\Users\krish\OneDrive\Desktop\Resourcify\terraform
terraform destroy -auto-approve
```

> **Note on timing:** CloudFront distributions take approximately **3 to 5 minutes** to disable and terminate globally. Do not interrupt the command while it runs.

Once complete, Terraform will display:
```text
Destroy complete! Resources: 32 destroyed.
```

### Step 2: Switch Backend to Local Offline Mode
Open `backend/.env` and ensure `DB_MODE` is set back to local memory:
```env
DB_MODE=local-memory
PORT=5001
NODE_ENV=development
```

---

## 💻 Zero-Cost Local Development (No AWS Needed)

You do **not** need to deploy to AWS to collaborate on code, test features, or demo the application. The project includes an in-memory database mode:

```powershell
cd c:\Users\krish\OneDrive\Desktop\Resourcify
npm run dev
```

- 🌐 **Frontend**: [http://localhost:5173](http://localhost:5173)
- 🔌 **Backend**: [http://localhost:5001/api](http://localhost:5001/api)
- 🩺 **Health Check**: [http://localhost:5001/health](http://localhost:5001/health)

---

## 🔧 Common Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `HTTP 502 Bad Gateway` on API | Lambda zip is missing `node_modules` | Run `.\build-lambda.ps1` from root, then `terraform apply -auto-approve` in `terraform` |
| `ERR_NAME_NOT_RESOLVED` | API Gateway DNS is still propagating | Wait 1-2 minutes and run `ipconfig /flushdns` |
| `AccessDeniedException` / SCP deny | AWS Organization Service Control Policy block | Deploy under the management account `899887267535` which is immune to SCPs |
| DynamoDB returns empty venues | Seed script hasn't run against DynamoDB | Run `cd backend; npm run seed` |
