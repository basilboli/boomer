TAG = 0.0.1
PREFIX = gcr.io/boomer-1470064436690

.PHONY: all
all: deploy

.PHONY: deploy
deploy: deploy-backend deploy-frontend

.PHONY: redeploy
redeploy:
	kubectl delete --ignore-not-found deployments backend frontend
	kubectl create --record=true -f kubernetes/deployments/frontend.yaml
	kubectl create --record=true -f kubernetes/deployments/backend.yaml

.PHONY: deploy-backend
deploy-backend: build-backend
	kubectl create --record=true -f kubernetes/deployments/backend.yaml
	kubectl create --record=true -f kubernetes/services/backend.yaml

build-backend: 
	cd backend; docker build -t $(PREFIX)/backend:$(TAG) .
	docker tag $(PREFIX)/backend:$(TAG) $(PREFIX)/backend
	docker push $(PREFIX)/backend:$(TAG)
	docker push $(PREFIX)/backend

build-frontend: 
	cd frontend; docker build -t $(PREFIX)/frontend:$(TAG) .
	docker tag $(PREFIX)/frontend:$(TAG) $(PREFIX)/frontend
	docker push $(PREFIX)/frontend:$(TAG)
	docker push $(PREFIX)/frontend

.PHONY: deploy-frontend
deploy-frontend: build-frontend
	# kubectl delete --ignore-not-found configmaps nginx-frontend-conf	
	# kubectl create configmap nginx-frontend-conf --from-file kubernetes/nginx/frontend.conf
	# kubectl get configmaps nginx-frontend-conf -o yaml
	# kubectl create secret generic tls-certs --from-file kubernetes/tls/
	kubectl create --record=true -f kubernetes/deployments/frontend.yaml
	kubectl create --record=true -f kubernetes/services/frontend.yaml

.PHONY: delete 
delete:
	kubectl delete --ignore-not-found deployments backend frontend
	kubectl delete --ignore-not-found services backend frontend
	# kubectl delete --ignore-not-found configmaps nginx-frontend-conf
	# kubectl delete --ignore-not-found secrets tls-certs
	
.PHONY: deploy-mongo
deploy-mongo:
	kubectl apply -f kubernetes/mongo/spec.yaml

.PHONY: build-mobile
build-mobile:	
	cd frontend; cordova build android
	gsutil cp frontend/platforms/android/build/outputs/apk/android-debug.apk gs://boomer_data/boomer.apk
	gsutil setacl public-read gs://boomer_data/boomer.apk

.PHONY: run-mongo
run-mongo:
	docker run -d -p 27017:27017 --name mongo-master mongo

.PHONY: delete-mongo
delete-mongo:
	kubectl delete --ignore-not-found -f kubernetes/mongo/spec.yaml