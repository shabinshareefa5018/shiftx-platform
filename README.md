ShiftX – AIOps CI Dashboard on OpenShift

ShiftX is a cloud-native demo application designed to showcase DevOps + AIOps practices using microservices deployed on Red Hat OpenShift.
It highlights modern CI/CD, observability, green-ops concepts, and application lifecycle automation.

This project contains:

A microservice application (service-a, web-frontend)

OpenShift deployment resources

CI/CD pipeline definitions

Infrastructure & documentation for AIOps dashboards and logs/metrics

A developer-friendly folder structure for future expansion

📁 Project Structure
shiftx/
├─ services/
│  ├─ service-a/           # Backend microservice (your logic here)
│  └─ web-frontend/        # UI / frontend
│
├─ infra/
│  ├─ openshift/           # YAML manifests for Deployment, Service, Route
│  └─ ci/                  # CI pipeline scripts / configs
│
├─ docs/                   # Documentation for architecture, AIOps, runbooks
│  ├─ architecture.md
│  ├─ aiops-dashboard.md
│  ├─ deploy.md
│  └─ troubleshooting.md
│
└─ README.md               # You are here

🌱 Project Goals

ShiftX demonstrates:

✔ DevOps

Git-based workflow (branches, commits, pipelines)

CI/CD automation

Containerization + deployment on OpenShift

Versioned deployments using KServe / Knative (if applicable)

✔ AIOps

Metrics collection (Prometheus)

Log analytics (ELK/EFK or OpenShift Logging)

Dashboards (Grafana)

Basic anomaly detection model (optional)

Event-driven alerts & automation

✔ GreenOps (Sustainability)

Auto-scaling to reduce compute waste

Request/limit tuning

Minimal container footprint

Intelligent scaling based on actual load

🔧 Tech Stack
Layer	Technology
Platform	Red Hat OpenShift
CI/CD	Tekton / Jenkins / GitHub Actions
Backend	Node.js / Python / Go (depending on your repo)
Frontend	HTML/React/Vue (your choice)
AIOps	Prometheus, Grafana, OpenShift Logging
Deployment	Kubernetes YAML, Routes, ConfigMaps
Image Build	Dockerfile / S2I
▶️ How to Run Locally
1️⃣ Clone repo
git clone https://github.com/<your-org>/shiftx.git
cd shiftx

2️⃣ Build frontend & service images
docker build -t shiftx-web ./services/web-frontend
docker build -t shiftx-service-a ./services/service-a

3️⃣ Run containers locally
docker run -p 8080:8080 shiftx-web
docker run -p 5000:5000 shiftx-service-a

☁️ Deploy on OpenShift
1️⃣ Login to cluster
oc login --token=<your-token> --server=<cluster-url>

2️⃣ Create project/namespace
oc new-project shiftx-dev

3️⃣ Apply deployment YAMLs
oc apply -f infra/openshift/

4️⃣ Get route URL
oc get routes


Open the provided URL to access the dashboard.

🔄 CI/CD Pipeline

CI/CD pipeline performs:

Code checkout

Image build

Push to registry

Deploy to OpenShift (dev namespace)

Trigger tests / health checks

Pipeline files are located in:

infra/ci/


or

.github/workflows/


depending on your setup.

📊 AIOps Dashboard

ShiftX includes:

⭐ Metrics

CPU, memory, request count, latency.

⭐ Logs

Structured logs ingestion (JSON logs).

⭐ Dashboards

Grafana visualizations for:

Pod health

API latency

Error rate

Deployment versions

⭐ Alerts

Prometheus rules for:

High CPU

Container restarts

Service unavailability

🧩 Future Enhancements

Add ML-based anomaly detection

Add autoscaling with KEDA

Integrate feature flags for experimentation

Add GitOps (ArgoCD) deployment model

🤝 Contributing

Create a new branch

Commit changes

Push branch & open PR

Pipeline will auto-trigger

🎯 Purpose in Hackathon

This project is built to demonstrate:

Your DevOps + Cloud skills

Microservice deployment

Infrastructure-as-code

CI/CD automation

AIOps observability

Team collaboration workflow

It is an ideal hackathon showcase because it touches every real DevOps lifecycle stage.

📞 Support

If you face issues, check:

docs/troubleshooting.md
