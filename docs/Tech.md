

# How to create google new cluster

gcloud container clusters create boomer-cluster \
     --num-nodes 3 \
     --machine-type f1-micro\
     --scopes cloud-platform

# Port forwarding

## To test any container locally you can forward the ports with the following commands :

kubectl port-forward --pod=mongo-master 27017:27017
kubectl port-forward --pod=redis-master 6379:6379