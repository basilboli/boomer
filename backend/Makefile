TAG = 1.1.4
RC = rc
PREFIX = gcr.io/boomer-1470064436690/boomer

build:
	godep save
	docker build -t $(PREFIX):$(TAG) .

build-rc:
	godep save
	docker build -t $(PREFIX):$(TAG)-$(RC) .

run: build
	docker run -e MONGO_MASTER_SERVICE_HOST="mongo-master" --rm -p 3000:3000 --link mongo-master:mongo-master $(PREFIX):$(TAG)

push-rc: build-rc
	gcloud docker push $(PREFIX):$(TAG)-$(RC)