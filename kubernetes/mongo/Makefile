.PHONY: all
all: deploy

.PHONY: deploy
deploy:
	kubectl create -f spec.yaml

.PHONY: run
run:
	docker run -d -p 27017:27017 --name mongo-master mongo

.PHONY: delete
delete:
	kubectl delete --ignore-not-found -f spec.yaml