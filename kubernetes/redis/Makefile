.PHONY: all
all: deploy

.PHONY: deploy
deploy:
	kubectl create -f spec.yaml

.PHONY: run
run:
	docker run -d -p 6379:6379 --name redis redis	

.PHONY: delete
delete:
	kubectl delete --ignore-not-found -f spec.yaml