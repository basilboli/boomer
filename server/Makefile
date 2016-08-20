TAG = 1.0
PREFIX = gcr.io/boomer-1470064436690/boomer

build:
	godep save
	docker build -t $(PREFIX):$(TAG) .

run: build
	docker run -e MONGO_MASTER_SERVICE_HOST="mongo-master" --rm -p 3000:3000 --link mongo-master:mongo-master $(PREFIX):$(TAG)

push: build
	gcloud docker push $(PREFIX):$(TAG)

deploy:
	kubectl create -f spec.yaml

nginx:
	kubectl create -f nginx-deployment.yaml

delete:
	kubectl delete --ignore-not-found -f spec.yaml

delete-nginx:
	kubectl delete --ignore-not-found -f nginx-deployment.yaml
