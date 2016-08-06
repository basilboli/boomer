build:
	godep save
	docker build -t gcr.io/boomer-1470064436690/boomer:v0.3 .

run: build
	docker run --name boomer -p 3000:3000 gcr.io/boomer-1470064436690/boomer:v0.3

push: build
	gcloud docker push gcr.io/boomer-1470064436690/boomer:v0.3

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
