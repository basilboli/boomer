gcloud container clusters get-credentials boomer-cluster
export GOOGLE_APPLICATION_CREDENTIALS=/Users/basilboli/dev/google/serviceaccount/boomer-92c5f59548fa.json

gcloud config configurations activate boomer

gcloud container clusters create boomer-cluster \
    --num-nodes 3 \
    --machine-type f1-micro\
    --scopes cloud-platform