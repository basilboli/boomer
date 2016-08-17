build:
	godep save
	docker build -t gcr.io/boomer-1470064436690/boomer:v0.01 .

run: build
	docker run -e MONGO_MASTER_SERVICE_HOST="mongo-master" --rm -p 3000:3000 --link mongo-master:mongo-master gcr.io/boomer-1470064436690/boomer:v0.01

push: build
	gcloud docker push gcr.io/boomer-1470064436690/boomer:v0.01

deploy: push
	kubectl create -f spec.yaml

deployOnly:
	kubectl create -f spec.yaml

delete:
	kubectl delete --ignore-not-found -f spec.yaml

logs:
	kubectl logs -f boomer-server

svc:
	kubectl get svc

pods:
	kubectl get pods

events:
	kubectl get events
