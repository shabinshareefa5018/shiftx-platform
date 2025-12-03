Deploy — ShiftX on OpenShift

This document describes step-by-step deployment instructions for ShiftX (dev/demo) on Red Hat OpenShift. It includes prerequisites, namespace setup, building and pushing images, applying manifests/overlays, secrets handling, CI/CD deploy steps, rollback, and common troubleshooting.

Keep secrets out of the repo. Use oc create secret, sealed-secrets, or a secrets manager (Vault/External Secrets).

Prerequisites

Access to an OpenShift cluster (credentials with permission to create projects/namespaces, deployments, roles).

oc CLI installed and logged in (oc version).

Docker / Podman (or CI runner) to build images.

A container registry (DockerHub, Quay, GitHub Packages, or private registry) and push credentials.

(Optional but recommended) Prometheus & Grafana Operators, OpenShift Logging (for AIOps observability).

Verify oc login:

oc whoami
oc version

1 — Project / Namespace setup

Create namespaces/projects for environments:

oc new-project shiftx-dev
oc new-project shiftx-staging
oc new-project shiftx-prod


Create resource quota / limits (optional):

oc create -f infra/openshift/quota-dev.yaml

2 — Build & push images
Local (manual)

Build images for each service and push to your registry:

# frontend
docker build -t <REGISTRY>/<ORG>/shiftx-web:${TAG} ./services/web-frontend
docker push <REGISTRY>/<ORG>/shiftx-web:${TAG}

# service-a
docker build -t <REGISTRY>/<ORG>/shiftx-service-a:${TAG} ./services/service-a
docker push <REGISTRY>/<ORG>/shiftx-service-a:${TAG}

Notes

Use GIT_SHA or git rev-parse --short HEAD as the image tag in CI pipelines for traceability.

In OpenShift you can optionally use S2I builds (oc new-app) or ImageStreams.

3 — Create image pull secret (if needed)

If your registry requires auth, create a imagePullSecret and link to the serviceaccount:

oc create secret docker-registry regcred \
  --docker-server=<REGISTRY> \
  --docker-username=<USER> \
  --docker-password=<PASSWORD> \
  --docker-email=<EMAIL> -n shiftx-dev

# attach to default SA in the namespace
oc secrets link default regcred --for=pull -n shiftx-dev


For CI secrets, store credentials in your CI secret store (Jenkins credentials, GitHub Secrets).

4 — Apply OpenShift manifests (infra/openshift or k8s/overlays/dev)

There are two options: plain YAML or Kustomize/Helm. Example:

# plain apply
oc apply -f infra/openshift/ -n shiftx-dev

# if using kustomize overlay
kubectl apply -k k8s/overlays/dev
# or
oc apply -k k8s/overlays/dev


Core resources to ensure are present:

Deployment / DeploymentConfig or Knative Service (KSVC) if serverless

Service

Route (OpenShift) / Ingress (Kubernetes)

ConfigMap / Secret (no plain secrets in repo)

HorizontalPodAutoscaler (HPA) — optional

ServiceAccount, Role/RoleBinding if your pods need cluster access

Example route check:

oc get routes -n shiftx-dev

5 — Verify deployment & health checks

Check pods & rollout:

oc get pods -n shiftx-dev
oc get deploy -n shiftx-dev
oc rollout status deployment/web-frontend -n shiftx-dev


View logs:

oc logs deployment/web-frontend -n shiftx-dev
# or for a pod:
oc logs -f pod/web-frontend-<id> -n shiftx-dev


Exec into a running pod:

oc rsh pod/web-frontend-<id> -n shiftx-dev
# or
oc exec -it pod/web-frontend-<id> -n shiftx-dev -- /bin/sh


Port-forward for local testing:

oc port-forward svc/web-frontend 8080:80 -n shiftx-dev
# then open http://localhost:8080

6 — Routes & Access

Get route hostname and open in browser:

oc get route web-frontend -n shiftx-dev -o jsonpath='{.spec.host}'; echo
# or
oc get routes -n shiftx-dev


If TLS is required, make sure Route.tls is configured (edge/reencrypt/passthrough) and certificate referenced.

7 — ConfigMaps & environment variables

Use ConfigMaps for non-sensitive configuration and Secrets for credentials.

Create a ConfigMap:

oc create configmap shiftx-config --from-file=./services/web-frontend/config -n shiftx-dev


Mount or inject via environment variables in the Deployment manifest:

envFrom:
  - configMapRef:
      name: shiftx-config

8 — Observability (AIOps basics)

If Prometheus / Grafana is available in cluster:

Add Prometheus scrape annotations to pods/services:

metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
    prometheus.io/path: /metrics


Add ServiceMonitor (Prometheus operator) resource under monitoring.coreos.com/v1:
infra/observability/servicemonitor-web-frontend.yaml (example included in repo).

Add Grafana dashboard JSONs under docs/dashboards/ and import them to your Grafana instance.

Setup alerting rules (PrometheusRule) for CPU, memory, restart counts, error rate.

9 — CI/CD Integration (example flow)

CI pipeline should automate:

Checkout → run tests → build images

Push images to registry

Update deployment manifests (image tags) or use image tag immutability + oc set image/kustomize patch

Deploy to shiftx-dev (apply manifests)

Run smoke tests → promote to staging → run integration tests → optionally promote to prod

Example oc set image step in pipeline:

oc project shiftx-dev
oc set image deployment/web-frontend web-frontend=${REGISTRY}/${ORG}/shiftx-web:${GIT_SHA} -n shiftx-dev
oc rollout status deployment/web-frontend -n shiftx-dev

10 — Rolling back

Check rollout history:

oc rollout history deployment/web-frontend -n shiftx-dev


Rollback to previous revision:

oc rollout undo deployment/web-frontend --to-revision=2 -n shiftx-dev
oc rollout status deployment/web-frontend -n shiftx-dev


If image tag was wrong, patch the image to a known good tag:

oc set image deployment/web-frontend web-frontend=${REGISTRY}/${ORG}/shiftx-web:<good-tag> -n shiftx-dev

11 — Common issues & troubleshooting
Pods CrashLoopBackoff / Crash

oc logs pod/<pod> to get stack traces

oc describe pod/<pod> to inspect events and probe failures

Typical causes: missing env vars, mount permission, DB unreachable, unhealthy readiness probe

Image pull errors

Check oc describe pod for ErrImagePull or ImagePullBackOff

Ensure imagePullSecret exists and is linked to the serviceaccount

Ensure image tag exists in the registry and registry allows pull from cluster

Route not accessible

oc get route -n shiftx-dev and oc describe route/<name>

Check TLS configuration; if using reencrypt, ensure CA/TLS configured

Check security groups / firewall if cluster is private

Deploy hangs on rollout

Check readiness/liveness probes — failing probes will prevent pod from being marked Ready

Look at events: oc get events -n shiftx-dev --sort-by=.metadata.creationTimestamp

Prometheus scraping missing

Confirm service annotations or ServiceMonitor existence

Ensure Prometheus Operator watches the namespace (or ServiceMonitor has label selector matched)

12 — Security best practices

Do not commit secrets. Use oc create secret, sealed-secrets, or Vault.

Run images as non-root where possible.

Set resource requests & limits for pods.

Enable S2I or image scanning in CI (Trivy/Clair).

Use RBAC to limit permissions for CI service accounts.

13 — Helpful oc commands cheat sheet
# general
oc whoami
oc get all -n shiftx-dev
oc get pods -n shiftx-dev
oc get deploy -n shiftx-dev
oc get route -n shiftx-dev

# logs & exec
oc logs -f deployment/web-frontend -n shiftx-dev
oc logs -f pod/web-frontend-<id> -n shiftx-dev
oc exec -it pod/web-frontend-<id> -n shiftx-dev -- /bin/sh

# rollout
oc rollout status deployment/web-frontend -n shiftx-dev
oc rollout history deployment/web-frontend -n shiftx-dev
oc rollout undo deployment/web-frontend -n shiftx-dev

# patch image
oc set image deployment/web-frontend web-frontend=<image> -n shiftx-dev

# port-forward
oc port-forward svc/web-frontend 8080:80 -n shiftx-dev

14 — Example minimal deployment files (reference)

infra/openshift/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-frontend
  template:
    metadata:
      labels:
        app: web-frontend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      containers:
      - name: web-frontend
        image: <REGISTRY>/<ORG>/shiftx-web:latest
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10


infra/openshift/service.yaml

apiVersion: v1
kind: Service
metadata:
  name: web-frontend
spec:
  selector:
    app: web-frontend
  ports:
    - name: http
      port: 80
      targetPort: 8080


infra/openshift/route.yaml

apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: web-frontend
spec:
  to:
    kind: Service
    name: web-frontend
  port:
    targetPort: http
  tls:
    termination: edge
# Deploy / OpenShift project

Project (namespace): `shabinshareefa5018-dev`
Created by: toolchain / CodeReady Toolchain

To target cluster:
```bash
oc login --token=<token> --server=<api-server>
oc project shabinshareefa5018-dev
