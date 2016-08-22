build:
	godep save
	docker build -t gcr.io/boomer-1470064436690/boomer:v0.1_ws .

run: build
	docker run -p 3000:3000 gcr.io/boomer-1470064436690/boomer:v0.1_ws

push: build
	gcloud docker push gcr.io/boomer-1470064436690/boomer:v0.1_ws
