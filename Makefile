.PHONY: all
all: deploy

.PHONY: deploy
deploy: deploy-backend deploy-frontend

.PHONY: deploy-backend
deploy-backend:
	kubectl create --record=true -f kubernetes/deployments/backend.yaml
	kubectl create --record=true -f kubernetes/services/backend.yaml

.PHONY: deploy-frontend
deploy-frontend:
	kubectl delete --ignore-not-found configmaps nginx-frontend-conf	
	kubectl create configmap nginx-frontend-conf --from-file nginx/frontend.conf
	kubectl get configmaps nginx-frontend-conf -o yaml
	kubectl create secret generic tls-certs --from-file tls/
	kubectl create --record=true -f kubernetes/deployments/frontend.yaml
	kubectl create --record=true -f kubernetes/services/frontend.yaml

.PHONY: delete 
delete:
	kubectl delete --ignore-not-found deployments backend frontend
	kubectl delete --ignore-not-found kubernetes/services backend frontend
	kubectl delete --ignore-not-found configmaps nginx-frontend-conf
	kubectl delete --ignore-not-found secrets tls-certs
	
.PHONY: deploy-mongo
deploy-mongo:
	kubectl create -f mongo/spec.yaml

.PHONY: build-client
build-client:	
	cd client; cordova build android
	gsutil cp client/platforms/android/build/outputs/apk/android-debug.apk gs://boomer_data/boomer.apk
	gsutil setacl public-read gs://boomer_data/boomer.apk

.PHONY: run-mongo
run-mongo:
	docker run -d -p 27017:27017 --name mongo-master mongo

.PHONY: delete-mongo
delete-mongo:
	kubectl delete --ignore-not-found -f mongo/spec.yaml